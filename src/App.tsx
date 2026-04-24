import { Routes, Route, Navigate } from "react-router-dom";
import { WizardLayout } from "@/components/WizardLayout";
import { Landing } from "@/pages/Landing";
import { UploadReceipt } from "@/pages/UploadReceipt";
import { ReviewItems } from "@/pages/ReviewItems";
import { AddPeople } from "@/pages/AddPeople";
import { AssignItems } from "@/pages/AssignItems";
import { AddFees } from "@/pages/AddFees";
import { Results } from "@/pages/Results";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/upload" element={<UploadReceipt />} />
      <Route element={<WizardLayout />}>
        <Route path="/review" element={<ReviewItems />} />
        <Route path="/people" element={<AddPeople />} />
        <Route path="/assign" element={<AssignItems />} />
        <Route path="/fees" element={<AddFees />} />
        <Route path="/results" element={<Results />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
