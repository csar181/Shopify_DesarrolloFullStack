import { Link } from 'react-router'

export default function Logo({ a = '/' }) {
  return (
    <Link to={a} className="flex items-center gap-2 text-lg font-semibold text-slate-900">
      <img src="/favicon.svg" alt="" className="size-7" />
      ShopCloud
    </Link>
  )
}
