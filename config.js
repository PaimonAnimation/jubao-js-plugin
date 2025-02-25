export default {
    // 接收举报的管理员QQ列表
    users: [1038984377], 
    
    // 接收举报的群列表
    groups: [],
    
    // 举报消息模板
    msgTemplate: `
  ---消息举报通知---
  ▌时间：{time}
  ▌群聊：{groupName} ({groupid})
  ▌举报者：{userName} ({userId})
  ▌消息ID：{msgId}
  ▌原消息内容：`, originalContent
  }