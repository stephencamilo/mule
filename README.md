<p align="center">
  <img src="https://emojicdn.elk.sh/🫏" alt="Mule Logo" width="80" />
</p>

<h1 align="center">Mule 🫏</h1>
<p align="center">
  <strong>Dynamic Headless CMS & REST API</strong><br/>
  <em>Express + Prisma + SQLite + Pug</em>
</p>

<p align="center">
  <img alt="GitHub License" src="https://img.shields.io/github/license/StephenCamilo/mule?style=flat-square&color=blueviolet" />
  <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/StephenCamilo/mule?style=flat-square&color=blueviolet" />
  <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/StephenCamilo/mule?style=flat-square&color=blueviolet" />
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/StephenCamilo/mule?style=flat-square&color=blueviolet" />
</p>

---

## 🎯 What is Mule?

Mule is a **headless API and admin panel generator** that transforms a single configuration file into:

- ✅ a complete **SQLite database** with auto‑generated Prisma schema
- ✅ a **dynamic REST API** with filtering
- ✅ a **beautiful admin interface** with Tailwind CSS + Alpine.js
- ✅ fully **customizable entity definitions** (EAV model)
- ✅ a **fluent builder API** for creating content types, fields, and content programmatically

> Define your data once, and Mule builds the entire backend – **zero boilerplate**.

---

## 🚀 Quick Start

```bash
git clone https://github.com/StephenCamilo/mule.git
cd mule
npm install
npm run generate-schema:migrate
npm run dev
```

🌐 Open your browser at **`http://localhost:3000/admin`** – you'll see a working admin panel!  
🔌 Test the API at **`http://localhost:3000/api/content_type`**.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧩 **Dynamic Entities** | Define tables, columns, relationships, and forms in a single JS config file. |
| ⚙️ **Auto Prisma Schema** | A script generates `prisma/schema.prisma` from your definitions, including all relations. |
| 🗄️ **SQLite Database** | Zero‑config local database, ready after one command. |
| 🔄 **Dynamic Model Layer** | `EntityModel` wraps Prisma and handles allowed fields, timestamps, and primary keys. |
| 📋 **Admin Panel** | List, create, edit, delete for every entity. Tailwind‑styled, responsive, with filters. |
| 🔌 **REST API** | Full CRUD for all entities, with query‑string filtering. |
| 🌐 **Multi‑language Ready** | Built‑in locale switcher (easily extendable). |
| 🎨 **Pug Templates** | Clean layout with partials for navbar, footer, alerts, and metadata. |
| 🧬 **Fluent Builder API** | Create content types, field types, fields, and content records using chainable, idiomatic JavaScript. |
| 🔒 **Field Type Constraints** | Associate allowed field types with content types via a junction table, ensuring data integrity. |

---

## 📁 Project Structure

```
mule/
├── config/
│   └── entityDefinitions.js   # 🧠 All your data models live here
├── controllers/
│   ├── adminController.js     # 🖥️ Dynamic admin CRUD
│   └── apiController.js       # 🌐 Dynamic REST API
├── lib/
│   └── builders.js            # 🧬 Fluent builders for programmatic content creation
├── middleware/
│   └── globals.js             # 🌍 Shared view data (locales, nav links)
├── models/
│   └── EntityModel.js         # 📦 Prisma wrapper per entity
├── scripts/
│   └── generate-schema.js     # 🛠️ Entity definitions → Prisma schema
├── views/
│   ├── layouts/
│   │   └── main.pug           # 🏗️ Base layout
│   ├── partials/
│   │   ├── alert.pug          # ✅❌ Alert messages
│   │   ├── footer.pug         # 🐾 Footer
│   │   ├── meta.pug           # 📝 SEO meta tags
│   │   └── navbar.pug         # 🧭 Navigation bar
│   └── admin/
│       ├── generic_list.pug   # 📋 List page
│       ├── generic_form.pug   # 📝 Create/Edit form
│       └── generic_confirm_delete.pug  # 🗑️ Deletion confirmation
├── seed.js                    # 🌱 Example seed script using builders
├── prisma/                    # (generated)
├── .env
├── package.json
└── server.js                  # 🏁 Entry point
```

---

## ⚡️ Usage

### 🖥️ Admin Interface

| Action         | URL                           |
|----------------|-------------------------------|
| List           | `/admin/:entity`              |
| Create         | `/admin/:entity/new`          |
| Edit           | `/admin/:entity/edit/:id`     |
| Delete         | `/admin/:entity/delete/:id`   |

Example: **`/admin/content_type`** shows all content types.

### 🌐 REST API

| Method   | Endpoint                  | Description          |
|----------|---------------------------|----------------------|
| `GET`    | `/api/:entity`            | List all records     |
| `GET`    | `/api/:entity/:id`        | Get one record       |
| `POST`   | `/api/:entity`            | Create a record      |
| `PUT`    | `/api/:entity/:id`        | Update a record      |
| `PATCH`  | `/api/:entity/:id`        | (alias for PUT)      |
| `DELETE` | `/api/:entity/:id`        | Delete a record      |

🔎 **Filtering example**:  
`/api/field_configs?content_type_id=1`

---

## 🧬 Fluent Builder API

Mule includes a set of chainable builder classes that let you create content types, field types, field configurations, and content records **programmatically** – perfect for seeding, migrations, or scripted content creation.

### Available builders

| Builder              | Purpose                                           |
|----------------------|---------------------------------------------------|
| `ContentTypeBuilder` | Create a content type and its fields in one go    |
| `FieldTypeBuilder`   | Create a reusable field type (e.g., "text", "reference") |
| `FieldBuilder`       | Create a standalone field config (less common)    |
| `ContentBuilder`     | Create a content record and set its field values   |

All builders use `EntityModel` under the hood, so data is stored exactly the same way as through the admin panel or API.

### Example seed script (`seed.js`)

```javascript
import { PrismaClient } from '@prisma/client';
import { ContentTypeBuilder, FieldTypeBuilder, ContentBuilder } from './lib/builders.js';

const prisma = new PrismaClient();

async function seed() {
  // Clean slate
  await prisma.content_reference.deleteMany();
  await prisma.field_value_blob.deleteMany();
  await prisma.field_value_real.deleteMany();
  await prisma.field_value_integer.deleteMany();
  await prisma.field_value_text.deleteMany();
  await prisma.content_data.deleteMany();
  await prisma.content_type_field_type.deleteMany();
  await prisma.field_configs.deleteMany();
  await prisma.content_type.deleteMany();
  await prisma.field_type.deleteMany();

  // 1. Create field types
  const textType      = await FieldTypeBuilder.of('text', 'text').label('Text').create();
  const longTextType  = await FieldTypeBuilder.of('long_text', 'text').label('Long Text').create();
  const referenceType = await FieldTypeBuilder.of('reference', 'reference').label('Reference').create();

  // 2. Create content types WITH their fields
  const recipeType = await ContentTypeBuilder.of('recipe', 'Recipe')
    .addField(textType, { name: 'name', label: 'Name' })
    .addField(longTextType, { name: 'description', label: 'Description' })
    .addField(referenceType, { name: 'ingredients', label: 'Ingredients' })
    .create();

  const ingredientType = await ContentTypeBuilder.of('ingredient', 'Ingredient')
    .addField(textType, { name: 'name', label: 'Name' })
    .create();

  // 3. Look up the created field configs
  const getField = (contentTypeId, name) =>
    prisma.field_configs.findFirst({ where: { content_type_id: contentTypeId, name } });

  const nameField          = await getField(recipeType.id, 'name');
  const descriptionField   = await getField(recipeType.id, 'description');
  const ingredientsField   = await getField(recipeType.id, 'ingredients');
  const ingredientNameField= await getField(ingredientType.id, 'name');

  // 4. Create ingredient content
  const cheese = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Cheese Cake').save();
  const milk   = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Milk').save();
  const salt   = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Salt').save();
  const pepper = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Pepper').save();

  // 5. Create a recipe referencing those ingredients
  const newRecipe = await new ContentBuilder(recipeType)
    .set(nameField, 'Cheese Cake')
    .set(descriptionField, 'This is a Cheese Cake')
    .set(ingredientsField, [cheese.id, milk.id, salt.id, pepper.id])
    .save();

  console.log('✅ Seed complete!');
  console.log('Recipe:', newRecipe);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
```

Run it anytime with:

```bash
node seed.js
```

---

## 🧪 Entity Configuration

Mule’s heart is **`config/entityDefinitions.js`**. Here you define every database table, its columns, relationships, validation rules, and admin form behaviour.

### New tables for content modelling

- **`field_type`** – Reusable field type definitions (e.g., "text", "reference") with a default storage type.
- **`content_type_field_type`** – Junction table that links a `content_type` to the `field_type`s it allows. This restricts which fields can be added to a content type.
- **`field_configs`** – Now includes `field_type_id` so each field belongs to a specific field type.

These tables enforce that **every field belongs to a field type**, and **every content type defines which field types are valid** for its content.

### Example snippet

```js
export const entityDefinitions = {
  field_type: {
    table: 'field_type',
    primaryKey: 'id',
    useTimestamps: true,
    fields: {
      id:   { type: 'INT', auto: true, label: 'ID', form: { type: 'hidden' } },
      name: { type: 'VARCHAR', constraint: 100, unique: true, label: 'Name', form: { type: 'text' } },
      label:{ type: 'VARCHAR', constraint: 255, label: 'Label', form: { type: 'text' } },
      storage_type: { type: 'VARCHAR', constraint: 20, default: 'text', label: 'Default Storage Type', form: { type: 'select', options: ['text','integer','real','blob','reference'] } }
    },
    allowedFilters: ['name', 'storage_type'],
    listColumns: ['id', 'name', 'label', 'storage_type', 'created_at'],
    formFields: ['name', 'label', 'storage_type']
  },

  content_type_field_type: {
    table: 'content_type_field_type',
    primaryKey: 'id',
    useTimestamps: false,
    fields: {
      id: { type: 'INT', auto: true, label: 'ID', form: { type: 'hidden' } },
      content_type_id: { type: 'INT', unsigned: true, null: false, label: 'Content Type', form: { type: 'select', source: 'content_type' } },
      field_type_id:   { type: 'INT', unsigned: true, null: false, label: 'Field Type', form: { type: 'select', source: 'field_type' } }
    },
    allowedFilters: ['content_type_id', 'field_type_id'],
    listColumns: ['id', 'content_type_id', 'field_type_id'],
    formFields: ['content_type_id', 'field_type_id'],
    foreignKeys: {
      content_type_id: ['content_type', 'id'],
      field_type_id: ['field_type', 'id']
    }
  },

  content_type: { /* unchanged */ },
  field_configs: {
    // ... now includes field_type_id foreign key and extra filters/columns
  }
  // ... remaining tables
};
```

After any edit, regenerate the Prisma schema and migrate:

```bash
npm run generate-schema:migrate
```

---

## 🛠️ npm Scripts

| Command                           | Description |
|-----------------------------------|-------------|
| `npm run dev`                     | Start dev server with hot reload |
| `npm run start`                   | Start production server |
| `npm run generate-schema`         | Generate `prisma/schema.prisma` |
| `npm run generate-schema:migrate` | Generate schema **and** migrate DB |

---

## 🧱 Tech Stack

- **Express** – Web framework
- **Prisma 5** – Type‑safe ORM
- **SQLite** – Database
- **Pug** – Template engine
- **Tailwind CSS** – Utility‑first CSS
- **Alpine.js** – Lightweight JS interactivity

---

## 👤 Author

**Stephen Camilo**  
🐙 GitHub: [@StephenCamilo](https://github.com/StephenCamilo)  
💼 This project is part of a passion for building flexible, dynamic web backends with minimal boilerplate.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/StephenCamilo/mule/issues).

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **ISC License**. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ and a lot of ☕ by <strong>Stephen Camilo</strong>.<br/>
  <sub>🫏 Because your content deserves a flexible home.</sub>
</p>