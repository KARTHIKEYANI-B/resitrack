import { FileX } from 'lucide-react'

export default function EmptyState({ title = 'No data found', description = '', icon: Icon = FileX }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
        <Icon size={22} className="text-gray-600" />
      </div>
      <p className="text-sm font-medium text-gray-400">{title}</p>
      {description && <p className="text-xs text-gray-600 max-w-xs text-center">{description}</p>}
    </div>
  )
}
