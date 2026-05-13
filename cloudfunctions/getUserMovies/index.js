const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const COLLECTION = 'user_movies'

exports.main = async (event) => {
  const { openid, status } = event
  const wxContext = cloud.getWXContext()
  const uid = openid || wxContext.OPENID

  if (!uid) {
    return { code: 401, message: '未登录' }
  }

  try {
    const query = db.collection(COLLECTION).where({ openid: uid })

    if (status) {
      query.where({ status })
    }

    const res = await query.orderBy('created_at', 'desc').get()

    return { code: 200, data: res.data }
  } catch (error) {
    return { code: 500, message: error.message || '查询失败' }
  }
}
