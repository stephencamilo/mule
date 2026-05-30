import { entityDefinitions } from '../config/entityDefinitions.js';
import { EntityModel } from '../models/EntityModel.js';

// ---------------------------------------------------------------------------
// Helper functions (unchanged)
// ---------------------------------------------------------------------------

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
      return Object.fromEntries(pk.map((k, i) => [k, ids[i]]));
    }
  } else {
    if (ids.length === 1) return Number(ids[0]);
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

    const baseClass = `block w-full rounded-lg border-gray-200 shadow-sm
                        focus:border-indigo-400 focus:ring focus:ring-indigo-200
                        focus:ring-opacity-50 transition duration-200`;
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

    const filterConfig = {
      label: fieldDef.label ?? fieldName.replace(/_/g, ' '),
      type: filterType,
      selected,
    };

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
    case 'FLOAT': case 'DOUBLE': case 'DECIMAL':
      return 'number';
    case 'DATE': return 'date';
    case 'DATETIME': return 'datetime-local';
    case 'TIME': return 'time';
    case 'BOOLEAN': return 'checkbox';
    default: return 'text';
  }
}

// ---------------------------------------------------------------------------
// Route handlers (read entityKey from req.params.entity)
// ---------------------------------------------------------------------------

export function index() {
  return async (req, res, next) => {
    console.log('DEBUG index – req.params:', req.params);
    const entityKey = req.params.entity;
    try {
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

      const items = await entity.findAll(where);

      const filters = buildFilterFields(def, req.query);
      for (const [fieldName, filter] of Object.entries(filters)) {
        if (filter.options === '__dynamic__') {
          const fieldDef = def.fields[fieldName];
          if (!fieldDef?.form?.source) continue;               // ← guard added
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
        locale: req.locale ?? 'en',
      });
    } catch (err) {
      next(err);
    }
  };
}

export function newForm() {
  return async (req, res, next) => {
    const entityKey = req.params.entity;
    try {
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
    } catch (err) {
      next(err);
    }
  };
}

export function create() {
  return async (req, res, next) => {
    const entityKey = req.params.entity;
    try {
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
    const entityKey = req.params.entity;
    try {
      const def = loadDefinition(entityKey);
      const ids = Object.values(req.params);
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
    } catch (err) {
      next(err);
    }
  };
}

export function update() {
  return async (req, res, next) => {
    const entityKey = req.params.entity;
    try {
      const def = loadDefinition(entityKey);
      const ids = Object.values(req.params);
      const id = extractId(ids, def);

      const entity = new EntityModel(entityKey);
      const data = { ...req.body };
      delete data._csrf;

      await entity.update(id, data);
      res.redirect(`/admin/${entityKey}`);
    } catch (err) {
      res.redirect(`/admin/${entityKey}/edit/${Object.values(req.params).join('/')}?error=${encodeURIComponent(err.message)}`);
    }
  };
}

export function deleteConfirm() {
  return async (req, res, next) => {
    const entityKey = req.params.entity;
    try {
      const def = loadDefinition(entityKey);
      const ids = Object.values(req.params);
      const id = extractId(ids, def);

      const entity = new EntityModel(entityKey);
      const record = await entity.find(id);
      if (!record) return res.status(404).send('Not found');

      res.render('admin/generic_confirm_delete', {
        entityKey,
        record,
        deleteUrl: `/admin/${entityKey}/delete/${ids.join('/')}`,
        locale: req.locale ?? 'en',
      });
    } catch (err) {
      next(err);
    }
  };
}

export function deleteEntity() {
  return async (req, res, next) => {
    const entityKey = req.params.entity;
    try {
      const def = loadDefinition(entityKey);
      const ids = Object.values(req.params);
      const id = extractId(ids, def);

      const entity = new EntityModel(entityKey);
      await entity.delete(id);
      res.redirect(`/admin/${entityKey}`);
    } catch (err) {
      next(err);
    }
  };
}