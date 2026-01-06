import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layout/AppLayout";

import Dashboard from "./pages/00_Dashboard";
import Patients from "./pages/01_Patient_Reg";
import Requests from "./pages/01_Patient_Req";
import Hotels from "./pages/01_Hotel_Reg";
import Schedules from "./pages/01_Patient_Sch";
import Transports from "./pages/01_Trans_Reg";
import Interpreters from "./pages/01_Interpreter_Reg";
import Prepayments from "./pages/01_Prepayment_Reg";
import MedicalSupplies from "./pages/01_MedicalSupplies_Reg";
import Caregivers from "./pages/01_Caregiver_Reg";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
        
      { path: "dashboard", element: <Dashboard /> },
      // ✅ REGISTRATION group
      {
        path: "registration",
        children: [
          { index: true, element: <Patients/> },
          { path: "patients", element: <Patients /> },
          { path: "requests", element: <Requests /> },
          { path: "hotels", element: <Hotels /> },
          { path: "schedules", element: <Schedules /> },
          { path: "transports", element: <Transports /> },
          { path: "interpreters", element: <Interpreters /> },
          { path: "prepayments", element: <Prepayments /> },
          { path: "caregivers", element: <Caregivers /> },
          { path: "medicalsupplies", element: <MedicalSupplies /> },
        ],
      },
    ],
  },
]);
