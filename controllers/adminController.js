import { entityDefinitions } from '../config/entityDefinitions.js';
import { EntityModel } from '../models/EntityModel.js';

function loadDefinition(entityKey) {
  const def = entityDefinitions[entityKey];
  if (!def) {
    const err = new Error('Entity not found');
    err.status = 404;
    throw err;
  }
  return def;
}

function extractId(ids, def) {
  const pk = def.primaryKey;
  if (Array.isArray(pk)) {
    if (ids.length === pk.length) {
      const result = {};
      for (let i = 0; i < pk.length; i++) {
        const val = ids[i];
        result[pk[i]] = isNaN(val) ? val : Number(val);
      }
      return result;
    }
  } else {
    const numericId = ids.find(id => !isNaN(Number(id)) && String(id).trim() !== '');
    if (numericId !== undefined) return Number(numericId);
  }
  const err = new Error('Invalid ID parameters');
  err.status = 404;
  throw err;
}

async function prepareFormOptionsForEntity(entityKey, def) {
  const options = {};
  for (const [fieldName, fieldConfig] of Object.entries(def.fields)) {
    const formType = fieldConfig.form?.type;
    if (formType === 'select') {
      if (fieldConfig.form.source) {
        const sourceEntity = new EntityModel(fieldConfig.form.source);
        const sourceItems = await sourceEntity.findAll();
        const sourceDef = loadDefinition(fieldConfig.form.source);
        const pk = sourceDef.primaryKey;
        options[fieldName] = {};
        for (const item of sourceItems) {
          const value = item[pk];
          const label = item.label ?? item.name ?? item[pk] ?? 'Unknown';
          if (value != null) options[fieldName][value] = String(label);
        }
      } else if (fieldConfig.form.options) {
        const raw = fieldConfig.form.options;
        if (Array.isArray(raw)) {
          options[fieldName] = Object.fromEntries(raw.map(v => [v, v]));
        } else {
          options[fieldName] = raw;
        }
      } else {
        options[fieldName] = {};
      }
    }
  }
  return options;
}

function buildFormFieldsData(def, record, isEdit, entityKey, selectOptions) {
  if (!def.formFields) return [];
  return def.formFields.map(fieldName => {
    const fieldConfig = def.fields[fieldName];
    const type = fieldConfig.form?.type ?? 'text';
    const label = fieldConfig.label ?? fieldName.replace(/_/g, ' ');
    const value = record?.[fieldName] ?? '';
    const isReadonly = isEdit && (fieldConfig.form?.readonlyOnEdit ?? false);
    const baseClass = `block w-full rounded-lg border-gray-200 shadow-sm focus:border-indigo-400 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition duration-200`;
    const readonlyClass = isReadonly ? ' bg-gray-50 cursor-not-allowed' : '';
    const inputClass = baseClass + readonlyClass;
    let html = '';
    switch (type) {
      case 'select': {
        const opts = selectOptions[fieldName] ?? {};
        const optionTags = Object.entries(opts)
          .map(([val, text]) => `<option value="${val}" ${String(val) === String(value) ? 'selected' : ''}>${text}</option>`)
          .join('');
        html = `<select name="${fieldName}" class="${inputClass}" ${isReadonly ? 'disabled' : ''}>${optionTags}</select>`;
        break;
      }
      case 'textarea':
        html = `<textarea name="${fieldName}" class="${inputClass}" rows="4" ${isReadonly ? 'readonly' : ''}>${value}</textarea>`;
        break;
      case 'checkbox':
        html = `<input type="checkbox" name="${fieldName}" value="1" ${value == 1 ? 'checked' : ''} class="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-200" ${isReadonly ? 'disabled' : ''} />`;
        break;
      default: {
        const stepAttr = fieldConfig.form?.step ? ` step="${fieldConfig.form.step}"` : '';
        const placeholder = ['text', 'number', 'email', 'url'].includes(type) ? ` placeholder="${label}"` : '';
        html = `<input type="${type}" name="${fieldName}" value="${value}" class="${inputClass}"${stepAttr}${placeholder} ${isReadonly ? 'readonly' : ''} />`;
      }
    }
    return { label, html };
  });
}

function buildFilterFields(def, queryParams) {
  const filters = {};
  for (const fieldName of (def.allowedFilters ?? [])) {
    const fieldDef = def.fields[fieldName];
    if (!fieldDef) continue;
    const filterType = mapFieldToFilterType(fieldDef);
    const selected = queryParams[fieldName] ?? '';
    const filterConfig = { label: fieldDef.label ?? fieldName.replace(/_/g, ' '), type: filterType, selected };
    if (filterType === 'select') {
      filterConfig.options = '__dynamic__';
    } else if (filterType === 'number' && (fieldDef.type === 'DECIMAL')) {
      filterConfig.step = 'any';
    }
    filters[fieldName] = filterConfig;
  }
  return filters;
}

function mapFieldToFilterType(fieldDef) {
  const formType = fieldDef.form?.type ?? '';
  if (formType === 'select') return 'select';
  const storageType = fieldDef.type?.toUpperCase() ?? 'VARCHAR';
  switch (storageType) {
    case 'INT': case 'TINYINT': case 'SMALLINT': case 'MEDIUMINT': case 'BIGINT':
    case 'FLOAT': case 'DOUBLE': case 'DECIMAL': return 'number';
    case 'DATE': return 'date';
    case 'DATETIME': return 'datetime-local';
    case 'TIME': return 'time';
    case 'BOOLEAN': return 'checkbox';
    default: return 'text';
  }
}

async function enrichItemsWithDisplayValues(items, def) {
  if (!items.length) return items;

  const foreignKeyFields = [];
  for (const [fieldName, fieldConfig] of Object.entries(def.fields)) {
    if (fieldConfig.form?.source) {
      foreignKeyFields.push(fieldName);
    }
  }
  if (!foreignKeyFields.length) return items;

  const cache = {};
  for (const field of foreignKeyFields) {
    cache[field] = {};
    const sourceKey = def.fields[field].form.source;
    const sourceDef = loadDefinition(sourceKey);
    const sourceEntity = new EntityModel(sourceKey);
    let allSourceItems = await sourceEntity.findAll();

    // -----------------------------------------------------------
    // Special handling for content_data: show the real name field
    // -----------------------------------------------------------
    if (sourceKey === 'content_data') {
      // 1. Group content_data records by content_type_id
      const grouped = {};
      for (const src of allSourceItems) {
        const ctId = src.content_type_id;
        if (!ctId) continue;
        if (!grouped[ctId]) grouped[ctId] = [];
        grouped[ctId].push(src.id);
      }

      // 2. Fetch content type names using raw SQL
      const contentTypeIds = Object.keys(grouped).map(Number);
      let contentTypeNames = {};
      if (contentTypeIds.length) {
        const contentTypes = await EntityModel.prisma.$queryRawUnsafe(
          `SELECT id, name, label FROM content_type WHERE id IN (${contentTypeIds.join(',')})`
        );
        contentTypeNames = Object.fromEntries(
          contentTypes.map(ct => [ct.id, ct.name || ct.label || ct.id])
        );
      }

      // 3. Find field_configs for the "name" field of each content type (include storage_type)
      const fieldConfigs = await EntityModel.prisma.$queryRawUnsafe(
        `SELECT id, content_type_id, storage_type FROM field_configs WHERE content_type_id IN (${contentTypeIds.join(',')}) AND name = 'name'`
      );
      const fieldConfigMap = {};  // content_type_id → { id, storage_type }
      for (const fc of fieldConfigs) {
        fieldConfigMap[fc.content_type_id] = { id: fc.id, storage_type: fc.storage_type };
      }

      // 4. Fetch the name values from the correct value table(s)
      const allContentDataIds = allSourceItems.map(src => src.id);
      const nameMap = {};

      if (allContentDataIds.length && Object.keys(fieldConfigMap).length) {
        // Separate field_config_ids by storage_type
        const textFieldConfigs = [];
        const intFieldConfigs = [];
        const realFieldConfigs = [];
        const blobFieldConfigs = [];

        for (const ctId of Object.keys(fieldConfigMap)) {
          const { id, storage_type } = fieldConfigMap[ctId];
          switch (storage_type) {
            case 'text': textFieldConfigs.push(id); break;
            case 'integer': intFieldConfigs.push(id); break;
            case 'real': realFieldConfigs.push(id); break;
            case 'blob': blobFieldConfigs.push(id); break;
          }
        }

        // Helper to query each table
        const fetchValues = async (table, fcIds) => {
          if (!fcIds.length) return [];
          return await EntityModel.prisma.$queryRawUnsafe(
            `SELECT content_data_id, value FROM ${table} WHERE content_data_id IN (${allContentDataIds.join(',')}) AND field_config_id IN (${fcIds.join(',')})`
          );
        };

        const [textVals, intVals, realVals, blobVals] = await Promise.all([
          fetchValues('field_value_text', textFieldConfigs),
          fetchValues('field_value_integer', intFieldConfigs),
          fetchValues('field_value_real', realFieldConfigs),
          fetchValues('field_value_blob', blobFieldConfigs),
        ]);

        const allValues = [...textVals, ...intVals, ...realVals, ...blobVals];

        for (const row of allValues) {
          if (!nameMap[row.content_data_id]) {
            nameMap[row.content_data_id] = String(row.value);
          }
        }
      }

      // 5. Build the display string
      for (const src of allSourceItems) {
        const ctName = contentTypeNames[src.content_type_id] || 'Content';
        const nameValue = nameMap[src.id];
        const display = nameValue || `${ctName} #${src.id}`;
        cache[field][src.id] = display;
      }
    } else {
      // Normal case: use label/name/primaryKey
      const labelField = sourceDef.fields.label ? 'label' : (sourceDef.fields.name ? 'name' : sourceDef.primaryKey);
      for (const src of allSourceItems) {
        const idValue = src[sourceDef.primaryKey];
        const display = src[labelField] ?? src[sourceDef.primaryKey] ?? 'Unknown';
        cache[field][idValue] = String(display);
      }
    }
  }

  for (const item of items) {
    item._display = {};
    for (const field of foreignKeyFields) {
      const idVal = item[field];
      if (idVal != null && cache[field][idVal]) {
        item._display[field] = cache[field][idVal];
      } else {
        item._display[field] = idVal;
      }
    }
  }
  return items;
}

export function index() {
  return async (req, res, next) => {
    try {
      const entityKey = req.params.entity;
      const def = loadDefinition(entityKey);
      const entity = new EntityModel(entityKey);
      const where = {};
      for (const fieldName of (def.allowedFilters ?? [])) {
        const val = req.query[fieldName];
        if (val !== undefined && val !== '') {
          const fieldDef = def.fields[fieldName];
          if (fieldDef) {
            const type = fieldDef.type?.toUpperCase() ?? '';
            if (['INT', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT'].includes(type)) {
              where[fieldName] = Number(val);
            } else {
              where[fieldName] = val;
            }
          }
        }
      }
      let items = await entity.findAll(where);
      items = await enrichItemsWithDisplayValues(items, def);
      const filters = buildFilterFields(def, req.query);
      for (const [fieldName, filter] of Object.entries(filters)) {
        if (filter.options === '__dynamic__') {
          const fieldDef = def.fields[fieldName];
          if (!fieldDef?.form?.source) continue;
          const sourceEntity = new EntityModel(fieldDef.form.source);
          const sourceItems = await sourceEntity.findAll();
          const sourceDef = loadDefinition(fieldDef.form.source);
          const pk = sourceDef.primaryKey;
          const opts = {};
          for (const item of sourceItems) {
            const value = item[pk];
            const label = item.label ?? item.name ?? item[pk] ?? 'Unknown';
            if (value != null) opts[value] = String(label);
          }
          filter.options = opts;
        }
      }
      res.render('admin/generic_list', {
        entityKey,
        items,
        columns: def.listColumns ?? [],
        fields: def.fields,
        filters,
        action: `/admin/${entityKey}`,
        def,
        locale: req.locale ?? 'en',
      });
    } catch (err) {
      next(err);
    }
  };
}

export function newForm() {
  return async (req, res, next) => {
    try {
      const entityKey = req.params.entity;
      const def = loadDefinition(entityKey);
      const selectOptions = await prepareFormOptionsForEntity(entityKey, def);
      const formFields = buildFormFieldsData(def, null, false, entityKey, selectOptions);
      res.render('admin/generic_form', {
        entityKey,
        formUrl: `/admin/${entityKey}/create`,
        isEdit: false,
        formFields,
        locale: req.locale ?? 'en',
      });
    } catch (err) { next(err); }
  };
}

export function create() {
  return async (req, res, next) => {
    try {
      const entityKey = req.params.entity;
      const entity = new EntityModel(entityKey);
      const data = { ...req.body };
      delete data._csrf;
      await entity.insert(data);
      res.redirect(`/admin/${entityKey}`);
    } catch (err) {
      res.redirect(`/admin/${entityKey}/new?error=${encodeURIComponent(err.message)}`);
    }
  };
}

export function edit() {
  return async (req, res, next) => {
    try {
      const entityKey = req.params.entity;
      const def = loadDefinition(entityKey);
      const allParams = Object.values(req.params);
      const ids = allParams.filter(p => p !== entityKey && p !== undefined && p !== '');
      const id = extractId(ids, def);
      const entity = new EntityModel(entityKey);
      const record = await entity.find(id);
      if (!record) return res.status(404).send('Not found');
      const selectOptions = await prepareFormOptionsForEntity(entityKey, def);
      const formFields = buildFormFieldsData(def, record, true, entityKey, selectOptions);
      res.render('admin/generic_form', {
        entityKey,
        formUrl: `/admin/${entityKey}/update/${ids.join('/')}`,
        isEdit: true,
        formFields,
        locale: req.locale ?? 'en',
      });
    } catch (err) { next(err); }
  };
}

export function update() {
  return async (req, res, next) => {
    try {
      const entityKey = req.params.entity;
      const def = loadDefinition(entityKey);
      const allParams = Object.values(req.params);
      const ids = allParams.filter(p => p !== entityKey && p !== undefined && p !== '');
      const id = extractId(ids, def);
      const entity = new EntityModel(entityKey);
      const data = { ...req.body };
      delete data._csrf;
      await entity.update(id, data);
      res.redirect(`/admin/${entityKey}`);
    } catch (err) {
      const entityKey = req.params.entity;
      const allParams = Object.values(req.params);
      const ids = allParams.filter(p => p !== entityKey && p !== undefined && p !== '');
      res.redirect(`/admin/${entityKey}/edit/${ids.join('/')}?error=${encodeURIComponent(err.message)}`);
    }
  };
}

export function deleteConfirm() {
  return async (req, res, next) => {
    try {
      const entityKey = req.params.entity;
      const def = loadDefinition(entityKey);
      const allParams = Object.values(req.params);
      const ids = allParams.filter(p => p !== entityKey && p !== undefined && p !== '');
      const id = extractId(ids, def);
      const entity = new EntityModel(entityKey);
      const record = await entity.find(id);
      if (!record) return res.status(404).send('Not found');
      res.render('admin/generic_confirm_delete', {
        entityKey,
        record,
        deleteUrl: `/admin/${entityKey}/delete/${ids.join('/')}`,
        def,
        locale: req.locale ?? 'en',
      });
    } catch (err) { next(err); }
  };
}

export function deleteEntity() {
  return async (req, res, next) => {
    try {
      const entityKey = req.params.entity;
      const def = loadDefinition(entityKey);
      const allParams = Object.values(req.params);
      const ids = allParams.filter(p => p !== entityKey && p !== undefined && p !== '');
      const id = extractId(ids, def);
      const entity = new EntityModel(entityKey);
      await entity.delete(id);
      res.redirect(`/admin/${entityKey}`);
    } catch (err) { next(err); }
  };
}