import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { BidUpload } from '@/components/BidUpload'
import { ProcessingStatus } from '@/components/ProcessingStatus'
import { AnalysisResults } from '@/components/AnalysisResults'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<BidUpload />} />
        <Route path="/processing/:opportunityId" element={<ProcessingStatus />} />
        <Route path="/analysis/:opportunityId" element={<AnalysisResults />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
