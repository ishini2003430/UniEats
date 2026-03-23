import OrdersManagementTab from "./OrdersManagementTab";
import PickupSlotManagementTab from "./PickupSlotManagementTab";

export default function OrdersTabContent({ activeOrderSubTab, user }) {
  if (activeOrderSubTab === "pickup-slot-management") {
    return <PickupSlotManagementTab user={user} />;
  }

  return <OrdersManagementTab user={user} />;
}
