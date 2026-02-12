import React from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useUserMenus } from '../hooks/useUserMenus';

/**
 * RoleBasedMenu component
 * Renders menu items based on user role
 * @param {Object} props - Component props
 * @param {Function} props.renderItem - Function to render a menu item
 * @param {Function} props.renderSection - Function to render a menu section
 * @returns {JSX.Element} React component
 */
const RoleBasedMenu = ({ 
  renderItem = (item) => <div>{item.label}</div>,
  renderSection = (section, items) => (
    <div key={section.id}>
      <h3>{section.label}</h3>
      <div>{items}</div>
    </div>
  )
}) => {
  const { getUserRole } = useAuth();
  const { menuItems } = useUserMenus();
  
  // Group menu items by section
  const menuSections = menuItems.reduce((acc, item) => {
    const sectionId = item.sectionId || 'default';
    if (!acc[sectionId]) {
      acc[sectionId] = {
        id: sectionId,
        label: item.sectionLabel || 'Menu',
        items: []
      };
    }
    acc[sectionId].items.push(item);
    return acc;
  }, {});

  return (
    <div className="role-based-menu">
      {Object.values(menuSections).map(section => {
        const renderedItems = section.items.map((item, index) => (
          <div key={item.id || index}>
            {renderItem(item)}
          </div>
        ));
        
        return renderSection(section, renderedItems);
      })}
    </div>
  );
};

export default RoleBasedMenu;