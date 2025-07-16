import React from "react";
import AuthModal from "./AuthModal";

const AdminModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AuthModal
      isOpen={isOpen}
      onClose={onClose}
      requiredRole="business"
      showBusinessForm={true}
    />
  );
};

export default AdminModal;
