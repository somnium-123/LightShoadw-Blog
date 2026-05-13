/**
 * Canvas 绘图工具 - 用于生成观影年度报告海报
 */

interface ReportData {
  year: number
  totalWatched: number
  avgRating: number
  totalRuntime: number
  topGenre: string
  topMovie: string
  avatarUrl: string
  nickName: string
}

/**
 * 生成观影年度报告海报
 * 使用离屏 Canvas 绘制，返回临时图片路径
 */
export async function generateYearReport(data: ReportData): Promise<string> {
  return new Promise((resolve, reject) => {
    // 微信小程序使用离屏 canvas
    // #ifdef MP-WEIXIN
    const query = uni.createSelectorQuery()
    query
      .select('#report-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) {
          reject(new Error('Canvas not found'))
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = uni.getSystemInfoSync().pixelRatio

        canvas.width = 750 * dpr
        canvas.height = 1334 * dpr
        ctx.scale(dpr, dpr)

        drawReport(ctx, data, 750, 1334)

        wx.canvasToTempFilePath({
          canvas,
          success: (result) => resolve(result.tempFilePath),
          fail: reject,
        })
      })
    // #endif

    // H5 回退
    // #ifdef H5
    resolve('')
    // #endif
  })
}

function drawReport(
  ctx: any,
  data: ReportData,
  width: number,
  height: number,
): void {
  // 背景
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, width, height)

  // 顶部装饰线
  ctx.fillStyle = '#ffa500'
  ctx.fillRect(0, 0, width, 6)

  // 标题
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 48px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${data.year} 观影年度报告`, width / 2, 120)

  // 核心数据
  const stats = [
    { label: '看过', value: `${data.totalWatched}部`, icon: '🎬' },
    { label: '平均评分', value: data.avgRating.toFixed(1), icon: '⭐' },
    { label: '观影时长', value: `${data.totalRuntime}小时`, icon: '⏱️' },
  ]

  stats.forEach((stat, i) => {
    const x = 80 + i * 220
    const y = 240

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 56px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(stat.value, x + 80, y)

    ctx.fillStyle = '#999999'
    ctx.font = '24px sans-serif'
    ctx.fillText(stat.label, x + 80, y + 50)
  })

  // 最爱类型 & 最爱电影
  ctx.fillStyle = '#ffa500'
  ctx.fillRect(60, 400, 630, 2)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 32px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('最爱的类型', 60, 470)
  ctx.fillStyle = '#ffa500'
  ctx.font = 'bold 40px sans-serif'
  ctx.fillText(data.topGenre, 60, 520)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 32px sans-serif'
  ctx.fillText('年度最佳', 60, 600)
  ctx.fillStyle = '#ffa500'
  ctx.font = 'bold 40px sans-serif'
  ctx.fillText(data.topMovie, 60, 650)

  // 底部用户信息
  ctx.fillStyle = '#999999'
  ctx.font = '24px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`— ${data.nickName} 的 MovieBlog 年度记录 —`, width / 2, height - 80)
}
