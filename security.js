/**
 * ============================================================================
 * SISTEMA DE SEGURIDAD Y PROTECCIÓN DE CÓDIGO - BANCO DEL TESORO
 * ============================================================================
 * Muestra el mensaje de error ÚNICAMENTE cuando el usuario intenta:
 * 1. Dar doble clic en la página.
 * 2. Presionar F12 o Control + F12 (y combinaciones con F12).
 * 3. Presionar Ctrl + Shift + I, Ctrl + Shift + J, Ctrl + Shift + C.
 * 4. Presionar Ctrl + U (Ver código fuente), Ctrl + S, Ctrl + P.
 * 5. Dar clic derecho (menú contextual).
 *
 * En cualquier otro momento ("de resto"), el mensaje NUNCA se muestra,
 * permitiendo una navegación 100% normal y limpia para el usuario.
 */

(function () {
  'use strict';

  let alertHideTimeout = null;

  /* ==========================================================================
     1. INYECCIÓN DE ESTILOS (El modal permanece 100% OCULTO por defecto)
     ========================================================================== */
  const style = document.createElement('style');
  style.id = 'bt-security-modal-styles';
  style.textContent = `
    /* Evitar selección de texto en textos y logos, manteniendo inputs utilizables */
    html, body, *:not(input):not(textarea) {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }

    input, textarea {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }

    /* Modal emergente de error de seguridad (Oculto de resto) */
    #bt-security-error-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 2147483647;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      animation: btFadeInModal 0.2s ease-out;
    }

    #bt-security-error-modal.visible {
      display: flex !important;
    }

    @keyframes btFadeInModal {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    .bt-sec-card {
      background: #111827;
      border: 2px solid #ef4444;
      border-radius: 18px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.25);
      max-width: 440px;
      width: 100%;
      padding: 30px 24px;
      text-align: center;
      color: #ffffff;
      position: relative;
    }

    .bt-sec-icon-circle {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.15);
      border: 2px solid rgba(239, 68, 68, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 18px auto;
      color: #ef4444;
    }

    .bt-sec-title {
      font-size: 18px;
      font-weight: 800;
      color: #f87171;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .bt-sec-message {
      font-size: 13.5px;
      color: #e2e8f0;
      line-height: 1.5;
      margin-bottom: 22px;
    }

    .bt-sec-btn {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #ffffff;
      border: none;
      padding: 11px 28px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
      transition: background 0.2s, transform 0.1s;
    }

    .bt-sec-btn:hover {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      transform: translateY(-1px);
    }

    .bt-sec-btn:active {
      transform: translateY(0);
    }
  `;

  if (document.head) {
    document.head.appendChild(style);
  } else {
    document.documentElement.appendChild(style);
  }

  /* ==========================================================================
     2. CREACIÓN DEL MODAL EN EL DOM
     ========================================================================== */
  function getModal() {
    let modal = document.getElementById('bt-security-error-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'bt-security-error-modal';
      modal.innerHTML = `
        <div class="bt-sec-card" role="dialog" aria-modal="true">
          <div class="bt-sec-icon-circle">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="bt-sec-title">Acción Bloqueada</div>
          <div class="bt-sec-message" id="bt-sec-modal-text">Por motivos de seguridad bancaria, esta acción no está permitida.</div>
          <button type="button" class="bt-sec-btn" id="bt-sec-close-btn">Entendido</button>
        </div>
      `;

      const target = document.body || document.documentElement;
      target.appendChild(modal);

      const closeBtn = document.getElementById('bt-sec-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', hideSecurityError);
      }

      // Si hace clic fuera de la tarjeta, también se cierra
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          hideSecurityError();
        }
      });
    }
    return modal;
  }

  function hideSecurityError() {
    const modal = document.getElementById('bt-security-error-modal');
    if (modal) {
      modal.classList.remove('visible');
    }
    clearTimeout(alertHideTimeout);
  }

  function showSecurityError(text) {
    const modal = getModal();
    const textEl = document.getElementById('bt-sec-modal-text');
    if (textEl && text) {
      textEl.textContent = text;
    }
    modal.classList.add('visible');

    // Cerrar automáticamente después de 3.5 segundos si el usuario no pulsa el botón
    clearTimeout(alertHideTimeout);
    alertHideTimeout = setTimeout(hideSecurityError, 3500);

    // Pequeña vibración en móviles
    try {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([120, 60, 120]);
      }
    } catch (e) {}
  }

  /* ==========================================================================
     3. EVENTO 1: DOBLE CLIC (Bloquear y mostrar mensaje de error)
     ========================================================================== */
  window.addEventListener('dblclick', function (e) {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
    // Permitir doble clic sólo en campos de texto legítimos para que el usuario pueda escribir/corregir
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    showSecurityError('El doble clic sobre este contenido está inhabilitado por políticas de seguridad.');
    return false;
  }, true);

  /* ==========================================================================
     4. EVENTO 2: CONTROL + F12, F12 Y ATAJOS DE TECLADO (Bloquear y mostrar error)
     ========================================================================== */
  const interceptKey = function (e) {
    const key = (e.key || '').toUpperCase();
    const keyCode = e.keyCode || e.which;
    const isCtrl = e.ctrlKey || e.metaKey; // Soporta Windows (Ctrl) y Mac (Cmd)
    const isShift = e.shiftKey;
    const isAlt = e.altKey;

    let blocked = false;
    let message = '';

    // 1. F12 o Control + F12 o cualquier combinación con F12
    if (key === 'F12' || keyCode === 123) {
      blocked = true;
      message = 'La tecla F12 y la combinación Control + F12 están permanentemente bloqueadas por seguridad.';
    }
    // 2. Ctrl + Shift + I (Inspeccionar elemento)
    else if (isCtrl && isShift && (key === 'I' || keyCode === 73)) {
      blocked = true;
      message = 'El atajo Ctrl + Shift + I (Inspeccionar) está bloqueado por seguridad.';
    }
    // 3. Ctrl + Shift + J (Consola de desarrollador)
    else if (isCtrl && isShift && (key === 'J' || keyCode === 74)) {
      blocked = true;
      message = 'El atajo Ctrl + Shift + J (Consola) está bloqueado por seguridad.';
    }
    // 4. Ctrl + Shift + C (Selector de elementos)
    else if (isCtrl && isShift && (key === 'C' || keyCode === 67)) {
      blocked = true;
      message = 'El atajo Ctrl + Shift + C (Selector) está bloqueado por seguridad.';
    }
    // 5. Ctrl + U (Ver código fuente)
    else if (isCtrl && !isShift && !isAlt && (key === 'U' || keyCode === 85)) {
      blocked = true;
      message = 'El atajo Ctrl + U (Ver Código Fuente) está estrictamente bloqueado.';
    }
    // 6. Ctrl + S (Guardar página)
    else if (isCtrl && !isShift && !isAlt && (key === 'S' || keyCode === 83)) {
      blocked = true;
      message = 'El atajo Ctrl + S (Guardar Código) está bloqueado.';
    }
    // 7. Ctrl + P (Imprimir estructura)
    else if (isCtrl && !isShift && !isAlt && (key === 'P' || keyCode === 80)) {
      blocked = true;
      message = 'La función de imprimir está inhabilitada.';
    }
    // 8. Mac: Cmd + Alt + I / J / C / U
    else if (isCtrl && isAlt && (key === 'I' || key === 'J' || key === 'C' || key === 'U')) {
      blocked = true;
      message = 'Las herramientas de inspección están deshabilitadas.';
    }

    if (blocked) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      showSecurityError(message);
      return false;
    }
  };

  window.addEventListener('keydown', interceptKey, true);
  window.addEventListener('keypress', interceptKey, true);
  window.addEventListener('keyup', interceptKey, true);

  /* ==========================================================================
     5. EVENTO 3: CLIC DERECHO (Bloquear y mostrar mensaje de error)
     ========================================================================== */
  window.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    showSecurityError('El clic derecho y el menú de inspección han sido bloqueados por seguridad bancaria.');
    return false;
  }, true);

  /* ==========================================================================
     6. BLOQUEO DE ARRASTRE Y SELECCIÓN NO AUTORIZADA
     ========================================================================== */
  window.addEventListener('dragstart', function (e) {
    e.preventDefault();
    return false;
  }, true);

  document.addEventListener('selectstart', function (e) {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      return true;
    }
    e.preventDefault();
    return false;
  }, true);

  // Exponer función de disparo manual si se requiere
  window.BTSecurityAlert = showSecurityError;

})();