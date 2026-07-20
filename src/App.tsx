import { Routes, Route } from 'react-router'
import Home from './pages/Home'

export default function App() {
  return (
    <Routes>
      {/* 使用 * 以兼容 GitHub Pages 子路径（如 /Schedule_management/）下的路由匹配 */}
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
