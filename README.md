# Ebola

# คำสั่งนี้จะเปิด MongoDB shell 
C:\Users\xxxxx>mongosh
Current Mongosh Log ID: 66fdffbd5fdd32ed90c73bf7
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.1
Using MongoDB:          7.0.14
Using Mongosh:          2.3.1

For mongosh info see: https://www.mongodb.com/docs/mongodb-shell/

------
   The server generated these startup warnings when booting
   2024-10-01T19:24:49.603+07:00: Access control is not enabled for the database. Read and write access to data and configuration is unrestricted
------
# สร้างฐานข้อมูล EbolaDB
test> use EbolaDB
switched to db EbolaDB

# สร้างผู้ใช้งาน user: "adminEbola" , pwd: "passEbola"
EbolaDB> db.createUser({ user: "adminEbola", pwd: "passEbola", roles: [{ role: "dbAdmin", db: "EbolaDB" }, "dbAdmin"] })
{ ok: 1 }

# ดูผู้ใช้งาน user: "adminEbola" , pwd: "passEbola"
EbolaDB> db.getUsers()
{
  users: [
    {
      _id: 'EbolaDB.adminEbola',
      userId: UUID('e863c492-a2a4-4860-857f-43967c2766c3'),
      user: 'adminEbola',
      db: 'EbolaDB',
      roles: [ { role: 'dbAdmin', db: 'EbolaDB' } ],
      mechanisms: [ 'SCRAM-SHA-1', 'SCRAM-SHA-256' ]
    }
  ],
  ok: 1
}

# สร้าง collection ebola
EbolaDB> db.createCollection("ebola")
{ ok: 1 }

# แสดง collections
EbolaDB> show collections
ebola

# สร้าง text index สำหรับไว้ค้นหา
EbolaDB> db.ebola.createIndex({ Country: "text" })
Country_text_Infected_text_Death_text

# ตรวจสอบข้อมูล text index ใน collections ebola
EbolaDB> db.ebola.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  {
    v: 2,
    key: { _fts: 'text', _ftsx: 1 },
    name: 'Country_text',
    weights: { Country: 1, Death: 1, Infected: 1 },
    default_language: 'english',
    language_override: 'language',
    textIndexVersion: 3
  }
]