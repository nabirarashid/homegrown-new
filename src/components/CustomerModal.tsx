// src/components/CustomerModal.tsx
import React from "react";
import AuthModal from "./AuthModal";

const CustomerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  return <AuthModal isOpen={isOpen} onClose={onClose} />;
};

export default CustomerModal;
