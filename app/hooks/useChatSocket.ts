import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const BASE_URL = process.env.EXPO_PUBLIC_CHAT_SERVER_URL!;
const API_KEY = process.env.EXPO_PUBLIC_CHAT_API_KEY!;

export type ConnectionState = "connected" | "connecting" | "disconnected";
type Listener = (data: any) => void;

let _socket: Socket | null = null;
let _refCount = 0;
const _listeners = new Map<string, Set<Listener>>();

const SERVER_EVENTS = [
    "message.new",
    "message.updated",
    "message.deleted",
    "message.new.thread",
    "message.reaction.new",
    "message.reaction.deleted",
    "message.read",
    "typing.start",
    "typing.stop",
    "state.synced",
    "room.added",
    "room.frozen",
    "notification.unread",
    "member.moderated",
    "user.presence.changed",
    "connection.changed",
] as const;

function _broadcast(event: string, data: any) {
    _listeners.get(event)?.forEach((fn) => fn(data));
}

function _connect(token: string) {
    if (_socket?.connected) return;
    _socket = io(`${BASE_URL}/v2/chat`, {
        path: "/socket.io",
        auth: { token, apiKey: API_KEY },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
    });
    _socket.on("connect", () => _broadcast("connection.changed", { status: "connected" }));
    _socket.on("disconnect", () => _broadcast("connection.changed", { status: "disconnected" }));
    _socket.on("connect_error", () => _broadcast("connection.changed", { status: "disconnected" }));
    _socket.on("reconnect", () => _broadcast("connection.changed", { status: "connected" }));
    for (const ev of SERVER_EVENTS) {
        if (ev === "connection.changed") continue;
        _socket.on(ev, (data: any) => _broadcast(ev, data));
    }
}

function _disconnect() {
    if (_socket) {
        _socket.removeAllListeners();
        _socket.disconnect();
        _socket = null;
    }
}

export interface UseChatSocketReturn {
    connectionState: ConnectionState;
    socketEmit: (event: string, data: any, ack?: (res: any) => void) => void;
    on: (event: string, listener: Listener) => void;
    off: (event: string, listener: Listener) => void;
}

export function useChatSocket(token: string | null): UseChatSocketReturn {
    const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");

    useEffect(() => {
        if (!token) return;
        _refCount++;
        _connect(token);
        const onChanged = ({ status }: { status: ConnectionState }) => setConnectionState(status);
        if (!_listeners.has("connection.changed")) _listeners.set("connection.changed", new Set());
        _listeners.get("connection.changed")!.add(onChanged);
        if (_socket?.connected) setConnectionState("connected");
        return () => {
            _listeners.get("connection.changed")?.delete(onChanged);
            _refCount--;
            if (_refCount <= 0) { _disconnect(); _refCount = 0; }
        };
    }, [token]);

    const on = useCallback((event: string, listener: Listener) => {
        if (!_listeners.has(event)) _listeners.set(event, new Set());
        _listeners.get(event)!.add(listener);
    }, []);

    const off = useCallback((event: string, listener: Listener) => {
        _listeners.get(event)?.delete(listener);
    }, []);

    const socketEmit = useCallback((event: string, data: any, ack?: (res: any) => void) => {
        if (!_socket?.connected) { ack?.({ success: false, message: "Socket not connected" }); return; }
        ack ? _socket.emit(event, data, ack) : _socket.emit(event, data);
    }, []);

    return { connectionState, socketEmit, on, off };
}
