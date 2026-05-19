// lib/types/index.ts
var SocketEvent = /* @__PURE__ */ ((SocketEvent2) => {
  SocketEvent2["CONNECT"] = "connect";
  SocketEvent2["DISCONNECT"] = "disconnect";
  SocketEvent2["CONNECT_ERROR"] = "connect_error";
  SocketEvent2["RECONNECT"] = "reconnect";
  SocketEvent2["RECONNECT_ATTEMPT"] = "reconnect_attempt";
  SocketEvent2["RECONNECT_ERROR"] = "reconnect_error";
  SocketEvent2["RECONNECT_FAILED"] = "reconnect_failed";
  SocketEvent2["AUTHENTICATED"] = "authenticated";
  SocketEvent2["AUTH_ERROR"] = "auth_error";
  SocketEvent2["JOIN_ROOM"] = "joinRoom";
  SocketEvent2["LEAVE_ROOM"] = "leaveRoom";
  SocketEvent2["SWITCH_ROOM"] = "switchRoom";
  SocketEvent2["ROOM_JOINED"] = "roomJoined";
  SocketEvent2["ROOM_LEFT"] = "roomLeft";
  SocketEvent2["ROOM_SWITCHED"] = "roomSwitched";
  SocketEvent2["CREATE_ROOM"] = "createRoom";
  SocketEvent2["ROOM_CREATED"] = "roomCreated";
  SocketEvent2["LIST_OF_GUEST_ROOMS"] = "listOfGuestRooms";
  SocketEvent2["GET_LIST_OF_GUEST_ROOMS"] = "getListOfGuestRooms";
  SocketEvent2["GET_ROOM_Media"] = "getRoomMedia";
  SocketEvent2["ROOM_MEDIA"] = "roomMedia";
  SocketEvent2["GET_ROOM_DATA_BY_ID"] = "getRoomDataById";
  SocketEvent2["ROOM_DATA"] = "roomData";
  SocketEvent2["GET_ROOM_MESSAGES"] = "getRoomMessages";
  SocketEvent2["ROOM_MESSAGES"] = "roomMessages";
  SocketEvent2["USER_ONLINE"] = "userOnline";
  SocketEvent2["SEND_MESSAGE"] = "sendMessage";
  SocketEvent2["NEW_MESSAGE"] = "newMessage";
  SocketEvent2["MESSAGE_EDITED"] = "messageEdited";
  SocketEvent2["MESSAGE_DELETED"] = "messageDeleted";
  SocketEvent2["EDIT_MESSAGE"] = "editMessage";
  SocketEvent2["DELETE_MESSAGE"] = "deleteMessage";
  SocketEvent2["MESSAGE_READ"] = "messageRead";
  SocketEvent2["MARK_MESSAGE_READ"] = "markMessageRead";
  SocketEvent2["USER_JOINED"] = "userJoined";
  SocketEvent2["USER_LEFT"] = "userLeft";
  SocketEvent2["USER_STATUS_CHANGED"] = "userStatusChanged";
  SocketEvent2["SET_USER_STATUS"] = "setUserStatus";
  SocketEvent2["ERROR"] = "error";
  SocketEvent2["TYPING"] = "typing";
  SocketEvent2["STOP_TYPING"] = "stopTyping";
  SocketEvent2["USER_TYPING"] = "userTyping";
  SocketEvent2["USER_STOPPED_TYPING"] = "userStoppedTyping";
  return SocketEvent2;
})(SocketEvent || {});
var RoomType = /* @__PURE__ */ ((RoomType2) => {
  RoomType2["DM"] = "dm";
  RoomType2["GROUP"] = "group";
  RoomType2["SELF"] = "self";
  RoomType2["ANONYMOUS"] = "anonymous";
  return RoomType2;
})(RoomType || {});
var UserStatus = /* @__PURE__ */ ((UserStatus2) => {
  UserStatus2["ONLINE"] = "online";
  UserStatus2["AWAY"] = "away";
  UserStatus2["OFFLINE"] = "offline";
  return UserStatus2;
})(UserStatus || {});
var MessageStatus = /* @__PURE__ */ ((MessageStatus2) => {
  MessageStatus2["SENT"] = "Sent";
  MessageStatus2["DELIVERED"] = "Delivered";
  MessageStatus2["READ"] = "Read";
  return MessageStatus2;
})(MessageStatus || {});
var Operators = /* @__PURE__ */ ((Operators2) => {
  Operators2["AND"] = "AND";
  Operators2["OR"] = "OR";
  Operators2["EQUALS"] = "EQUALS";
  Operators2["NOT_EQUALS"] = "NOT_EQUALS";
  Operators2["GREATER_THAN"] = "GREATER_THAN";
  Operators2["LESS_THAN"] = "LESS_THAN";
  Operators2["GREATER_THAN_OR_EQUAL"] = "GREATER_THAN_OR_EQUAL";
  Operators2["LESS_THAN_OR_EQUAL"] = "LESS_THAN_OR_EQUAL";
  Operators2["IN"] = "IN";
  Operators2["CONTAINS"] = "CONTAINS";
  return Operators2;
})(Operators || {});
var IPermissionEntityType = /* @__PURE__ */ ((IPermissionEntityType2) => {
  IPermissionEntityType2["MODERATOR"] = "MODERATOR";
  IPermissionEntityType2["ADMIN"] = "ADMIN";
  IPermissionEntityType2["MEMBER"] = "MEMBER";
  IPermissionEntityType2["ROLE"] = "ROLE";
  IPermissionEntityType2["ANONYMOUS"] = "ANONYMOUS";
  return IPermissionEntityType2;
})(IPermissionEntityType || {});
var IRoomPermissionType = /* @__PURE__ */ ((IRoomPermissionType2) => {
  IRoomPermissionType2["CAN_SEND_MESSAGES"] = "CAN_SEND_MESSAGES";
  IRoomPermissionType2["CAN_DELETE_OWN_MESSAGES"] = "CAN_DELETE_OWN_MESSAGES";
  IRoomPermissionType2["CAN_EDIT_OWN_MESSAGES"] = "CAN_EDIT_OWN_MESSAGES";
  IRoomPermissionType2["CAN_UPLOAD_FILES"] = "CAN_UPLOAD_FILES";
  IRoomPermissionType2["CAN_DELETE_OWN_FILES"] = "CAN_DELETE_OWN_FILES";
  IRoomPermissionType2["CAN_DELETE_OTHER_MESSAGES"] = "CAN_DELETE_OTHER_MESSAGES";
  IRoomPermissionType2["CAN_PIN_MESSAGES"] = "CAN_PIN_MESSAGES";
  IRoomPermissionType2["CAN_MODERATE_USERS"] = "CAN_MODERATE_USERS";
  IRoomPermissionType2["CAN_CHANGE_ROOM_NAME"] = "CAN_CHANGE_ROOM_NAME";
  IRoomPermissionType2["CAN_CHANGE_ROOM_DESCRIPTION"] = "CAN_CHANGE_ROOM_DESCRIPTION";
  IRoomPermissionType2["CAN_MANAGE_PERMISSIONS"] = "CAN_MANAGE_PERMISSIONS";
  IRoomPermissionType2["CAN_MANAGE_SETTINGS"] = "CAN_MANAGE_SETTINGS";
  IRoomPermissionType2["CAN_GRANT_MODERATOR_ROLE"] = "CAN_GRANT_MODERATOR";
  IRoomPermissionType2["CAN_UPDATE_ROOM_DATA"] = "CAN_UPDATE_ROOM_DATA";
  IRoomPermissionType2["CAN_GRANT_ADMIN_ROLE"] = "CAN_GRANT_ADMIN_ROLE";
  IRoomPermissionType2["CAN_SEND_MESSAGE"] = "CAN_SEND_MESSAGE";
  return IRoomPermissionType2;
})(IRoomPermissionType || {});
export {
  IPermissionEntityType,
  IRoomPermissionType,
  MessageStatus,
  Operators,
  RoomType,
  SocketEvent,
  UserStatus
};
//# sourceMappingURL=index.mjs.map