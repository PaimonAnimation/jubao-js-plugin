import plugin from '../../lib/plugins/plugin.js';
import { segment } from 'oicq';
import moment from "moment";
import cfg from './config.js';  // 从同级目录导入配置

export class report extends plugin {
  constructor() {
    super({
      name: '消息举报2.0',
      dsc: '举报不良消息给管理员',
      event: 'message',
      priority: 500,
      rule: [
        {
          reg: "^#举报$",
          fnc: 'reportMsg'
        }
      ]
    });
    this.checkConfig();
  }

  // 配置检查
  checkConfig() {
    const requiredKeys = ['users', 'groups'];
    requiredKeys.forEach(key => {
      if (!cfg[key]) {
        logger.error(`[举报插件] 缺少必要配置项：${key}`);
      }
    });
  }

  async reportMsg(e) {
    // 获取被引用的消息
    const replyMsg = await e.getReply();
    if (!replyMsg) {
      await e.reply("请先引用要举报的消息再使用本功能", true);
      return true;
    }

    // 获取基础信息
    const baseInfo = {
      time: moment().format('YYYY-MM-DD HH:mm:ss'),
      groupName: e.group_name,
      groupId: e.group_id,
      userName: e.sender.card || e.sender.nickname,
      userId: e.user_id,
      msgId: replyMsg.message_id
    };

    try {
      // 获取被举报消息的完整内容
      const fullMsg = await Bot.getMsg(replyMsg.message_id);
      const originalContent = fullMsg.message || [];

      // 构建消息内容
     
      const reportMsg = [
        this.buildTemplate(baseInfo),
      ]
      .concat(originalMsg.message || []);
    

      // 发送给配置目标
      await this.sendToTargets(reportMsg, baseInfo);

      // 回复举报者
      await e.reply([
        segment.at(baseInfo.userId),
        "✅举报信息已提交，管理员将尽快处理！"
      ], true);

    } catch (err) {
      logger.error(`[举报插件] 处理失败：${err}`);
      await e.reply("举报信息处理失败，请联系管理员", true);
    }
    return true;
  }

  // 构建消息模板
  buildTemplate(info) {
    return cfg.msgTemplate
      .replace(/{groupName}/g, info.groupName)
      .replace(/{groupId}/g, info.groupId)
      .replace(/{time}/g, info.time)
      .replace(/{userName}/g, info.userName)
      .replace(/{userId}/g, info.userId)
      .replace(/{msgId}/g, info.msgId);
      //.replace(/{originalMsg}/g, originalMsg.message);
  }

  // 发送到配置的目标
  async sendToTargets(msg, info) {
    try {
      // 发送给用户
      if (cfg.users?.length > 0) {
        cfg.users.forEach(async qq => {
          const user = Bot.pickUser(qq);
          await user.sendMsg([`来自群 ${info.groupName} 的举报：`].concat(msg));
        });
      }

      // 发送到群组
      if (cfg.groups?.length > 0) {
        cfg.groups.forEach(async groupId => {
          const group = Bot.pickGroup(groupId);
          await group.sendMsg([`收到来自群 ${info.groupName} 的举报：`].concat(msg));
        });
      }

    } catch (err) {
      logger.error(`[举报插件] 消息发送失败：${err}`);
    }
  }
}