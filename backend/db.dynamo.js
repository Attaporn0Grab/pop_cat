/* Thai:
เลเยอร์ฐานข้อมูล DynamoDB (AWS SDK v3):
- โครงสร้างตาราง: DDB_TABLE (เช่น 'popcat_stats')
- แถว Global: pk = 'GLOBAL#TOTAL' เก็บ total (Number)
- แถว Country: pk = `COUNTRY#${country}` เก็บ total ต่อประเทศ
- addPops() ใช้ UpdateItem แบบ atomic ADD เพื่อกัน race
- getLeaderboard() ใช้ Scan สำหรับเดโม/ฟรีเทียร์ ถ้าข้อมูลโต แนะนำทำ GSI
*/
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"

const REGION = process.env.AWS_REGION || "ap-southeast-1"
const TABLE  = process.env.DDB_TABLE || "popcat_stats"

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true }
})

async function getItemTotal(pk) {
  const out = await ddb.send(new GetCommand({ TableName: TABLE, Key: { pk } }))
  return Number(out.Item?.total || 0)
}

export async function getTotal() {
  return getItemTotal("GLOBAL#TOTAL")
}

export async function getLeaderboard(limit = 100) {
  const params = {
    TableName: TABLE,
    ProjectionExpression: "#pk, #t",
    FilterExpression: "begins_with(#pk, :p)",
    ExpressionAttributeNames: { "#pk": "pk", "#t": "total" },
    ExpressionAttributeValues: { ":p": "COUNTRY#" }
  }

  let items = []
  let lastKey = undefined
  do {
    const out = await ddb.send(new ScanCommand({
      ...params,
      ExclusiveStartKey: lastKey
    }))
    if (Array.isArray(out.Items)) items.push(...out.Items)
    lastKey = out.LastEvaluatedKey
    // กันหลุดโลก ถ้าข้อมูลบาน
    if (items.length > 5000) break
  } while (lastKey)

  const rows = items.map(it => ({
      country: String((it.pk || "").split("#")[1] || "XX"),
      total: Number(it.total || 0)
    }))
    .filter(x => !!x.country)
    .sort((a, b) => b.total - a.total)
    .slice(0, Math.max(1, Math.min(500, limit)))

  return rows
}


export async function addPops(country, n) {
  const pkCountry = `COUNTRY#${country}`

  // เพิ่มยอดประเทศ
  const upCountry = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { pk: pkCountry },
    UpdateExpression: "ADD #t :inc",
    ExpressionAttributeNames: { "#t": "total" },
    ExpressionAttributeValues: { ":inc": n },
    ReturnValues: "UPDATED_NEW"
  }))
  const countryTotal = Number(upCountry.Attributes?.total || 0)

  // เพิ่มยอดรวมโลก
  const upGlobal = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { pk: "GLOBAL#TOTAL" },
    UpdateExpression: "ADD #t :inc",
    ExpressionAttributeNames: { "#t": "total" },
    ExpressionAttributeValues: { ":inc": n },
    ReturnValues: "UPDATED_NEW"
  }))
  const globalTotal = Number(upGlobal.Attributes?.total || 0)

  return { countryTotal, globalTotal }
}
