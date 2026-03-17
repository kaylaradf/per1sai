export function AdminRetroWindow({ children, footer, onClose, title, wide = false }) {
  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true">
      <section className={`admin-modal-window ${wide ? 'is-wide' : ''}`}>
        <header className="window-header admin-modal-header">
          <button type="button" className="window-control" aria-label="Close dialog" onClick={onClose} />
          <div className="title-bar-lines" />
          <h2 className="window-title">{title}</h2>
          <div className="title-bar-lines" />
          <button type="button" className="window-control" aria-label="Close dialog" onClick={onClose} />
        </header>
        <div className="admin-modal-body">{children}</div>
        {footer ? <div className="admin-modal-footer">{footer}</div> : null}
      </section>
    </div>
  )
}

export function AdminConfirmDialog({ busy = false, cancelLabel = 'Cancel', confirmLabel = 'Confirm', message, onCancel, onConfirm, title }) {
  return (
    <AdminRetroWindow
      title={title}
      onClose={onCancel}
      footer={
        <div className="admin-inline-actions">
          <button type="button" className="ghost-btn" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="action-btn" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="admin-copy">{message}</p>
    </AdminRetroWindow>
  )
}

export default AdminRetroWindow
