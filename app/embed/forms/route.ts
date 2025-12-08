import { NextRequest, NextResponse } from "next/server"

const SCRIPT_SOURCE = `;(function () {
  try {
    try {
      if (typeof window !== 'undefined' && window.top && window.top !== window.self) {
        // Don't show popup inside iframes (embedded forms)
        return
      }
    } catch (e) {}

    var script = document.currentScript
    if (!script) return

    var formKey = script.getAttribute('data-form-key')
    if (!formKey) {
      console.warn('[عَقدي Forms] data-form-key attribute is required on the script tag.')
      return
    }

    console.log('[عَقدي Forms] Init script for formKey:', formKey, 'src:', script.src)

    try {
      if (typeof window !== 'undefined') {
        ;(window).__rwForms = (window).__rwForms || {}
        if ((window).__rwForms[formKey]) {
          // Already initialized for this form on this page
          return
        }
        ;(window).__rwForms[formKey] = true
      }
    } catch (e) {}

    var scriptSrc = script.src || ''
    var baseUrl
    try {
      baseUrl = new URL(scriptSrc).origin
    } catch (e) {
      baseUrl = ''
    }

    if (!baseUrl) {
      console.warn('[عَقدي Forms] Could not determine base URL from script src.')
      return
    }

    var dataMode = script.getAttribute('data-mode') || ''
    var dataMaxWidth = script.getAttribute('data-max-width')
    var dataDelay = script.getAttribute('data-delay')
    var dataOnce = script.getAttribute('data-popup-once')
    var dataPopupHeightVh = script.getAttribute('data-popup-height-vh')

    var configUrl = baseUrl + '/api/forms/' + encodeURIComponent(formKey) + '/config'

    function parseBool(value, defaultValue) {
      if (value === null || value === undefined || value === '') return defaultValue
      var v = String(value).toLowerCase()
      if (v === 'true' || v === '1' || v === 'yes') return true
      if (v === 'false' || v === '0' || v === 'no') return false
      return defaultValue
    }

    function createInline(iframeUrl, maxWidth) {
      var container = document.createElement('div')
      container.style.width = '100%'
      container.style.maxWidth = (maxWidth || 480) + 'px'
      container.style.margin = '0 auto'

      var iframe = document.createElement('iframe')
      iframe.src = iframeUrl
      iframe.style.width = '100%'
      iframe.style.border = '0'
      iframe.style.display = 'block'
      iframe.style.height = '0'
      iframe.loading = 'lazy'

      iframe.addEventListener('load', function () {
        try {
          var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document)
          if (!doc) return
          var body = doc.body
          var html = doc.documentElement
          var height = Math.max(
            body ? body.scrollHeight : 0,
            body ? body.offsetHeight : 0,
            html ? html.scrollHeight : 0,
            html ? html.offsetHeight : 0,
          )
          iframe.style.height = height + 'px'
          console.log('[عَقدي Forms] Inline iframe resized for formKey', formKey, 'height =', height)
        } catch (e) {}
      })

      container.appendChild(iframe)
      script.parentNode && script.parentNode.insertBefore(container, script.nextSibling)
    }

    function createPopup(iframeUrl, maxWidth, delayMs, oncePerSession, popupHeightVh) {
      var storageKey = 'rw_form_popup_' + formKey
      if (oncePerSession && typeof sessionStorage !== 'undefined') {
        try {
          if (sessionStorage.getItem(storageKey) === 'shown') {
            return
          }
        } catch (e) {}
      }

      function show() {
        var previousBodyOverflow = ''
        try {
          previousBodyOverflow = document.body && document.body.style ? document.body.style.overflow || '' : ''
          if (document.body && document.body.style) {
            document.body.style.overflow = 'hidden'
          }
        } catch (e) {}
        // احذف أي overlay قديم لهذه الفورم قبل إنشاء واحد جديد
        try {
          var existingOverlays = document.querySelectorAll('[data-rw-form-overlay="' + formKey + '"]')
          for (var i = 0; i < existingOverlays.length; i++) {
            var node = existingOverlays[i]
            if (node && node.parentNode) {
              node.parentNode.removeChild(node)
            }
          }
        } catch (e) {}

        var overlay = document.createElement('div')
        overlay.setAttribute('data-rw-form-overlay', formKey)
        overlay.style.position = 'fixed'
        overlay.style.inset = '0'
        overlay.style.background = 'rgba(15,23,42,0.75)'
        overlay.style.display = 'flex'
        overlay.style.alignItems = 'center'
        overlay.style.justifyContent = 'center'
        overlay.style.zIndex = '999999'
        overlay.style.overflowY = 'auto'
        overlay.style.padding = '24px'
        overlay.style.boxSizing = 'border-box'

        var modal = document.createElement('div')
        modal.style.width = '100%'
        modal.style.maxWidth = (maxWidth || 480) + 'px'
        modal.style.margin = '0'
        modal.style.background = 'transparent'
        modal.style.borderRadius = '16px'
        modal.style.overflow = 'hidden'
        modal.style.boxShadow = '0 25px 50px -12px rgba(15,23,42,0.5)'
        modal.style.position = 'relative'

        var closeBtn = document.createElement('button')
        closeBtn.type = 'button'
        closeBtn.innerHTML = '\u00d7'
        closeBtn.setAttribute('aria-label', 'Close')
        closeBtn.style.position = 'absolute'
        closeBtn.style.top = '8px'
        closeBtn.style.left = '12px'
        closeBtn.style.width = '28px'
        closeBtn.style.height = '28px'
        closeBtn.style.borderRadius = '999px'
        closeBtn.style.border = 'none'
        closeBtn.style.cursor = 'pointer'
        closeBtn.style.background = 'rgba(15,23,42,0.06)'
        closeBtn.style.color = '#0f172a'
        closeBtn.style.fontSize = '16px'

        var iframe = document.createElement('iframe')
        iframe.src = iframeUrl
        iframe.style.width = '100%'
        iframe.style.border = '0'
        iframe.style.display = 'block'
        iframe.style.height = '0'
        iframe.style.background = 'transparent'
        iframe.loading = 'lazy'

        iframe.addEventListener('load', function () {
          try {
            var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document)
            if (!doc) return
            var body = doc.body
            var html = doc.documentElement
            var height = Math.max(
              body ? body.scrollHeight : 0,
              body ? body.offsetHeight : 0,
              html ? html.scrollHeight : 0,
              html ? html.offsetHeight : 0,
            )
            // اجعل iframe بطول المحتوى بالكامل، واسمح للـ overlay نفسه بالتمرير إذا كان المحتوى أطول من الشاشة
            iframe.style.height = height + 'px'
            console.log('[عَقدي Forms] Popup iframe resized for formKey', formKey, 'height =', height)
          } catch (e) {}
        })

        function close() {
          if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay)
          }
          try {
            if (document.body && document.body.style) {
              document.body.style.overflow = previousBodyOverflow
            }
          } catch (e) {}
        }

        closeBtn.addEventListener('click', function () {
          close()
        })

        overlay.addEventListener('click', function (event) {
          if (event.target === overlay) {
            close()
          }
        })

        modal.appendChild(closeBtn)
        modal.appendChild(iframe)
        overlay.appendChild(modal)
        document.body.appendChild(overlay)

        if (oncePerSession && typeof sessionStorage !== 'undefined') {
          try {
            sessionStorage.setItem(storageKey, 'shown')
          } catch (e) {}
        }
      }

      var delay = typeof delayMs === 'number' && delayMs >= 0 ? delayMs : 2000
      if (delay === 0) {
        show()
      } else {
        window.setTimeout(show, delay)
      }
    }

    fetch(configUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load form config')
        return res.json()
      })
      .then(function (payload) {
        if (!payload || !payload.success) throw new Error('Invalid config payload')
        var embed = payload.embed || {}

        var mode = dataMode || embed.mode || 'inline'
        var maxWidth = dataMaxWidth ? parseInt(dataMaxWidth, 10) : embed.maxWidth || 480

        if (!maxWidth || isNaN(maxWidth)) maxWidth = 480

        var delayMs
        if (dataDelay !== null && dataDelay !== undefined && dataDelay !== '') {
          delayMs = parseInt(dataDelay, 10)
        } else if (typeof embed.popupDelayMs === 'number') {
          delayMs = embed.popupDelayMs
        } else {
          delayMs = 2000
        }
        if (isNaN(delayMs) || delayMs < 0) delayMs = 2000

        var popupHeightVh
        if (dataPopupHeightVh !== null && dataPopupHeightVh !== undefined && dataPopupHeightVh !== '') {
          popupHeightVh = parseInt(dataPopupHeightVh, 10)
        } else if (typeof embed.popupHeightVh === 'number') {
          popupHeightVh = embed.popupHeightVh
        } else {
          popupHeightVh = 80
        }
        if (isNaN(popupHeightVh) || popupHeightVh <= 0 || popupHeightVh > 100) popupHeightVh = 80

        var oncePerSession = parseBool(dataOnce, embed.popupOncePerSession !== false)

        var iframeUrl = baseUrl + '/forms/' + encodeURIComponent(formKey) + '?embed=1'

        console.log('[عَقدي Forms] Resolved embed config', {
          formKey: formKey,
          mode: mode,
          maxWidth: maxWidth,
          delayMs: delayMs,
          oncePerSession: oncePerSession,
          popupHeightVh: popupHeightVh,
        })

        if (mode === 'popup') {
          console.log('[عَقدي Forms] Creating popup for formKey', formKey)
          createPopup(iframeUrl, maxWidth, delayMs, oncePerSession, popupHeightVh)
        } else {
          console.log('[عَقدي Forms] Creating inline embed for formKey', formKey)
          createInline(iframeUrl, maxWidth)
        }
      })
      .catch(function (err) {
        console.warn('[عَقدي Forms] Failed to load config, falling back to inline iframe.', err)
        var fallbackUrl = baseUrl + '/forms/' + encodeURIComponent(formKey) + '?embed=1'
        var maxWidth = dataMaxWidth ? parseInt(dataMaxWidth, 10) : 480
        if (!maxWidth || isNaN(maxWidth)) maxWidth = 480
        createInline(fallbackUrl, maxWidth)
      })
  } catch (e) {
    console.error('[عَقدي Forms] Unexpected error:', e)
  }
})();
`

export async function GET(_req: NextRequest) {
  return new NextResponse(SCRIPT_SOURCE, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
