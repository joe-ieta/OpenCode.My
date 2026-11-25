import { app } from "electron"
import { resolveIdentity, type Channel } from "./identity"

const raw = import.meta.env.OPENCODE_CHANNEL

export const CHANNEL: Channel = raw === "local" || raw === "dev" || raw === "beta" || raw === "prod" ? raw : "dev"

export const VERSION = app.isPackaged ? app.getVersion() : (process.env.OPENCODE_VERSION ?? app.getVersion())

const identity = resolveIdentity(CHANNEL, app.isPackaged)

export const APP_NAME = app.isPackaged
  ? (import.meta.env.OPENCODE_DESKTOP_PRODUCT_NAME ?? identity.appName)
  : identity.appName

export const APP_ID = app.isPackaged ? (import.meta.env.OPENCODE_DESKTOP_APP_ID ?? identity.appID) : identity.appID

export const APP_USER_MODEL_ID = app.isPackaged ? APP_ID : identity.appUserModelID
