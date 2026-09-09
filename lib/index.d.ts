import z from "@deepseek-ai/schemastery";
import { Context } from "@deepseek-ai/cordis";
//#region src/shared.d.ts
/** 用户可调的通知设置. */
interface NotificationSettings {
  /** 回合跑完时通知. */
  notifyOnIdle: boolean;
  /** 步骤或回合出错时通知. */
  notifyOnError: boolean;
  /** 工具调用等待审批时通知. */
  notifyOnApproval: boolean;
  /** 短于此时长的回合不发 "跑完了" 通知. */
  minTurnDurationMs: number;
  /** 在运行 dsh 的机器上弹出系统原生通知. */
  desktop: boolean;
  /** 在查看 Web UI 的机器上弹出浏览器 Notification. */
  browser: boolean;
  /** 标签页可见时不弹浏览器通知. */
  browserOnlyWhenHidden: boolean;
  /** 可选 webhook URL, 空字符串表示关闭. */
  webhookUrl: string;
  /** 桌面和浏览器通知标题. */
  title: string;
}
//#endregion
//#region src/index.d.ts
declare const name = "dsh-notification";
type Config = NotificationSettings;
/** Loader / settings 共用的通知 schema. */
declare const Config: z<Schemastery.ObjectS<{
  notifyOnIdle: z<boolean, boolean>;
  notifyOnError: z<boolean, boolean>;
  notifyOnApproval: z<boolean, boolean>;
  minTurnDurationMs: z<number, number>;
  desktop: z<boolean, boolean>;
  browser: z<boolean, boolean>;
  browserOnlyWhenHidden: z<boolean, boolean>;
  webhookUrl: z<string, string>;
  title: z<string, string>;
}>, Schemastery.ObjectT<{
  notifyOnIdle: z<boolean, boolean>;
  notifyOnError: z<boolean, boolean>;
  notifyOnApproval: z<boolean, boolean>;
  minTurnDurationMs: z<number, number>;
  desktop: z<boolean, boolean>;
  browser: z<boolean, boolean>;
  browserOnlyWhenHidden: z<boolean, boolean>;
  webhookUrl: z<string, string>;
  title: z<string, string>;
}>>;
/**
 * 注册 settings 命名空间, 并把 Loader 行配置作为 composition 底.
 * @param ctx - Host 插件上下文.
 * @param config - Loader 校验后的行配置, 缺省时使用 schema 默认值.
 */
declare function apply(ctx: Context, config?: NotificationSettings): void;
//#endregion
export { Config, type NotificationSettings, apply, name };
//# sourceMappingURL=index.d.ts.map