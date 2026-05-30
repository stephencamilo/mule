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
| 🚀 **Instant Prototyping** | Add a new entity in 30 seconds – no manual migration files. |

---

## 📁 Project Structure

```
mule/
├── config/
│   └── entityDefinitions.js   # 🧠 All your data models live here
├── controllers/
│   ├── adminController.js     # 🖥️ Dynamic admin CRUD
│   └── apiController.js       # 🌐 Dynamic REST API
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

## 🧪 Entity Configuration Example

```js
// config/entityDefinitions.js
export const entityDefinitions = {
  content_type: {
    table: 'content_type',
    primaryKey: 'id',
    useTimestamps: true,
    fields: {
      id:   { type: 'INT', auto: true, label: 'ID', form: { type: 'hidden' } },
      name: { type: 'VARCHAR', constraint: 100, unique: true, label: 'Name', form: { type: 'text' } },
      label:{ type: 'VARCHAR', constraint: 255, label: 'Label', form: { type: 'text' } }
    },
    allowedFilters: ['name', 'label'],
    listColumns: ['id', 'name', 'label', 'created_at'],
    formFields: ['name', 'label']
  }
  // ... add more entities here
};
```

After any change, run:

```bash
npm run generate-schema:migrate
```

This updates the Prisma schema and applies the migration automatically.

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
  <sub>🐾 Because your content deserves a flexible home.</sub>
</p>