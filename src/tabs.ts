export type TabDef = {
  id: string;
  path: string;
  title: string;
};

export const TAB_DEFS: TabDef[] = [
  { id: "dashboard", path: "/dashboard", title: "대시보드" },

  { id: "reg-patients", path: "/registration/patients", title: "환자 등록" },
  { id: "reg-requests", path: "/registration/requests", title: "환자 의뢰 등록" },
  { id: "reg-hotels", path: "/registration/hotels", title: "환자 호텔 등록" },
  { id: "reg-schedules", path: "/registration/schedules", title: "환자 일정 등록" },
  { id: "reg-transports", path: "/registration/transports", title: "환자 교통 등록" },
  { id: "reg-interpreters", path: "/registration/interpreters", title: "환자 통역 등록" },
  { id: "reg-prepayments", path: "/registration/prepayments", title: "선결제 등록" },
  { id: "reg-caregivers", path: "/registration/caregivers", title: "개인사업자 비용 등록" },
  { id: "reg-medicalsupplies", path: "/registration/medicalsupplies", title: "환자 진료지원비 등록" },

  { id: "settings", path: "/settings", title: "설정" },
];
