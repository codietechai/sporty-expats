// lib/v2/types/index.ts
import { EventEmitter } from "eventemitter3";
var SocketEvent = /* @__PURE__ */ ((SocketEvent2) => {
  SocketEvent2["CONNECT"] = "connect";
  SocketEvent2["DISCONNECT"] = "disconnect";
  SocketEvent2["CONNECT_ERROR"] = "connect_error";
  SocketEvent2["CONNECTION_SUCCESS"] = "connection.success";
  SocketEvent2["CONNECTION_ERROR"] = "connection.error";
  SocketEvent2["ROOM_WATCH"] = "room.watch";
  SocketEvent2["ROOM_STOP_WATCH"] = "room.stop_watch";
  SocketEvent2["MESSAGE_SEND"] = "message.send";
  SocketEvent2["MESSAGE_UPDATE"] = "message.update";
  SocketEvent2["MESSAGE_DELETE"] = "message.delete";
  SocketEvent2["MESSAGE_MARK_READ"] = "message.mark_read";
  SocketEvent2["MESSAGE_REACTION"] = "message.reaction";
  SocketEvent2["MESSAGE_REACTION_DELETE"] = "message.reaction.delete";
  SocketEvent2["MESSAGE_NEW"] = "message.new";
  SocketEvent2["MESSAGE_UPDATED"] = "message.updated";
  SocketEvent2["MESSAGE_DELETED"] = "message.deleted";
  SocketEvent2["MESSAGE_READ"] = "message.read";
  SocketEvent2["MESSAGE_REACTION_NEW"] = "message.reaction.new";
  SocketEvent2["MESSAGE_REACTION_DELETED"] = "message.reaction.deleted";
  SocketEvent2["NOTIFICATION_UNREAD"] = "notification.unread";
  SocketEvent2["USER_PRESENCE_CHANGED"] = "user.presence.changed";
  SocketEvent2["TYPING_START"] = "typing.start";
  SocketEvent2["TYPING_STOP"] = "typing.stop";
  SocketEvent2["CONNECTION_CHANGED"] = "connection.changed";
  SocketEvent2["THREAD_NEW"] = "message.new.thread";
  SocketEvent2["ROOM_ADDED"] = "room.added";
  SocketEvent2["ROOM_REMOVED"] = "room.removed";
  SocketEvent2["ROOM_DELETED"] = "room.deleted";
  SocketEvent2["ROOM_FROZEN"] = "room.frozen";
  SocketEvent2["ROOM_TRUNCATED"] = "room.truncated";
  SocketEvent2["MEMBER_MODERATED"] = "member.moderated";
  SocketEvent2["STATE_SYNCED"] = "state.synced";
  return SocketEvent2;
})(SocketEvent || {});
var ChatClientEmitter = class extends EventEmitter {
};
var RoomMemberRole = /* @__PURE__ */ ((RoomMemberRole2) => {
  RoomMemberRole2["member"] = "member";
  RoomMemberRole2["owner"] = "owner";
  RoomMemberRole2["admin"] = "admin";
  RoomMemberRole2["moderator"] = "moderator";
  RoomMemberRole2["custom"] = "custom";
  return RoomMemberRole2;
})(RoomMemberRole || {});
var ChatUserRole = /* @__PURE__ */ ((ChatUserRole2) => {
  ChatUserRole2["user"] = "user";
  ChatUserRole2["admin"] = "admin";
  ChatUserRole2["moderator"] = "moderator";
  ChatUserRole2["custom"] = "custom";
  ChatUserRole2["guest"] = "guest";
  return ChatUserRole2;
})(ChatUserRole || {});
var MessageType = /* @__PURE__ */ ((MessageType2) => {
  MessageType2["text"] = "text";
  MessageType2["image"] = "image";
  MessageType2["file"] = "file";
  MessageType2["system"] = "system";
  MessageType2["mixed"] = "mixed";
  return MessageType2;
})(MessageType || {});
var RoomType = /* @__PURE__ */ ((RoomType2) => {
  RoomType2["messaging"] = "messaging";
  RoomType2["support"] = "support";
  return RoomType2;
})(RoomType || {});
var RoomSubType = /* @__PURE__ */ ((RoomSubType2) => {
  RoomSubType2["group"] = "group";
  RoomSubType2["direct"] = "direct";
  return RoomSubType2;
})(RoomSubType || {});
var RoomVisibility = /* @__PURE__ */ ((RoomVisibility2) => {
  RoomVisibility2["private"] = "private";
  RoomVisibility2["public"] = "public";
  return RoomVisibility2;
})(RoomVisibility || {});
export {
  ChatClientEmitter,
  ChatUserRole,
  MessageType,
  RoomMemberRole,
  RoomSubType,
  RoomType,
  RoomVisibility,
  SocketEvent
};
//# sourceMappingURL=index.mjs.map