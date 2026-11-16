import { useContext } from 'react'
import { ToastContext } from '../components/Toast.jsx'

export default function useToast() {
  return useContext(ToastContext)
}
