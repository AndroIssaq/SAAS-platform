export type FormFieldType = "text" | "email" | "phone" | "textarea" | "select" | "checkbox"

export interface FormFieldOption {
  value: string
  label: string
}

export interface FormField {
  id: string
  type: FormFieldType
  name: string
  label: string
  placeholder?: string
  required?: boolean
  options?: FormFieldOption[]
  isPrimaryEmail?: boolean
}

export type FormThemeBackground = "light" | "dark"
export type FormThemeRadius = "none" | "sm" | "md" | "lg" | "full"
export type FormThemeSize = "sm" | "md" | "lg"
export type FormThemeLayout = "stacked" | "split"
export type FormThemeSpacing = "compact" | "normal" | "comfortable"
export type FormThemeTitleAlign = "right" | "center"
export type FormThemeButtonAlign = "stretch" | "right" | "center"
export type FormThemeImagePosition = "left" | "right"

export interface FormTheme {
  primaryColor: string
  background: FormThemeBackground
  radius: FormThemeRadius
  size: FormThemeSize
  submitLabel: string
  publicTitle?: string
  publicSubtitle?: string
  layout?: FormThemeLayout
  imageUrl?: string
  cardBackgroundColor?: string
  spacing?: FormThemeSpacing
  titleAlign?: FormThemeTitleAlign
  buttonAlign?: FormThemeButtonAlign
  imagePosition?: FormThemeImagePosition
}

export type FormEmbedMode = "inline" | "popup"

export interface FormEmbedSettings {
  mode: FormEmbedMode
  maxWidth?: number
  popupDelayMs?: number
  popupOncePerSession?: boolean
  popupHeightVh?: number
}

export interface FormConfig {
  fields: FormField[]
  theme: FormTheme
  embed: FormEmbedSettings
}

export interface FormRecord {
  id: string
  form_key: string
  title: string
  description: string | null
  config: FormConfig
  created_at: string
  account_id: string
  user_id: string
}
