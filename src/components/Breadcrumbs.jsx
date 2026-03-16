import { Link } from 'react-router-dom'

export default function Breadcrumbs({ items }) {
  return (
    <div className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={`${item.label}-${index}`} className="crumb">
            {item.to && !isLast ? (
              <Link to={item.to} className="crumb-link">
                {item.label}
              </Link>
            ) : (
              <span className="crumb-current">{item.label}</span>
            )}
            {!isLast && <span className="crumb-separator">/</span>}
          </span>
        )
      })}
    </div>
  )
}
