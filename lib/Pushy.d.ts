import {BrowserWindow} from "electron";

declare namespace Pushy {

    type DeviceToken = string

    type Listener<T> = (data: T) => void

    type ConnectivityListener<T> = (connected: boolean, error: T) => void

    function listen(): void

    function setNotificationListener<T>(l: Listener<T>): void
    
    function setConnectivityListener<T>(l: ConnectivityListener<T>): void

    function register(opts: { appId: string }): Promise<DeviceToken>

    function isRegistered(): boolean

    function subscribe(topics: string | string[]): Promise<void>

    function unsubscribe(topics: string | string[]): Promise<void>

    function validateDeviceCredentials(): Promise<void>

    function setHeartbeatInterval(seconds: number): void

    function isEnterpriseConfigured(): boolean

    function setEnterpriseConfig(endpoint: string, mqttEndpoint: string): void

    function mTLS(config: object): void

    function disconnect(): void

    function alert(win: BrowserWindow, msg: string): void
}

export = Pushy
export as namespace Pushy
