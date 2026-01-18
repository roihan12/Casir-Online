-- View untuk analisis perubahan izin akses menu (audit trail)
CREATE OR REPLACE VIEW vw_menu_permission_audit AS
SELECT 
    rm.role_menu_id,
    r.role_id,
    r.nama_role,
    r.display_name AS role_display_name,
    m.menu_id,
    m.menu_name,
    m.path,
    COALESCE(p.menu_name, 'Main Menu') AS parent_menu,
    rm.can_view,
    rm.can_create,
    rm.can_edit,
    rm.can_delete,
    rm.created_at,
    rm.updated_at,
    rm.created_by,
    rm.updated_by,
    CASE 
        WHEN rm.created_at = rm.updated_at THEN 'Created'
        ELSE 'Updated'
    END AS action_type
FROM role_menu rm
JOIN roles r ON rm.role_id = r.role_id
JOIN menu m ON rm.menu_id = m.menu_id
LEFT JOIN menu p ON m.parent_id = p.menu_id
ORDER BY rm.updated_at DESC, r.nama_role, m.menu_name;

-- View untuk analisis distribusi izin akses berdasarkan role
CREATE OR REPLACE VIEW vw_role_permission_distribution AS
SELECT 
    r.role_id,
    r.nama_role,
    r.display_name,
    COUNT(DISTINCT rm.menu_id) AS total_menus,
    SUM(CASE WHEN rm.can_view = true THEN 1 ELSE 0 END) AS view_count,
    SUM(CASE WHEN rm.can_create = true THEN 1 ELSE 0 END) AS create_count,
    SUM(CASE WHEN rm.can_edit = true THEN 1 ELSE 0 END) AS edit_count,
    SUM(CASE WHEN rm.can_delete = true THEN 1 ELSE 0 END) AS delete_count,
    ROUND(SUM(CASE WHEN rm.can_view = true THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(DISTINCT rm.menu_id), 0) * 100, 2) AS view_percentage,
    ROUND(SUM(CASE WHEN rm.can_create = true THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(DISTINCT rm.menu_id), 0) * 100, 2) AS create_percentage,
    ROUND(SUM(CASE WHEN rm.can_edit = true THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(DISTINCT rm.menu_id), 0) * 100, 2) AS edit_percentage,
    ROUND(SUM(CASE WHEN rm.can_delete = true THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(DISTINCT rm.menu_id), 0) * 100, 2) AS delete_percentage
FROM roles r
LEFT JOIN role_menu rm ON r.role_id = rm.role_id
GROUP BY r.role_id, r.nama_role, r.display_name
ORDER BY r.nama_role;

-- View untuk analisis menu yang tidak digunakan (orphaned menus)
CREATE OR REPLACE VIEW vw_orphaned_menus AS
SELECT 
    m.menu_id,
    m.menu_name,
    m.path,
    m.icon,
    COALESCE(p.menu_name, 'Main Menu') AS parent_menu,
    m.order_index,
    m.is_active,
    m.created_at,
    m.updated_at
FROM menu m
LEFT JOIN menu p ON m.parent_id = p.menu_id
LEFT JOIN role_menu rm ON m.menu_id = rm.menu_id
WHERE rm.menu_id IS NULL
ORDER BY m.created_at DESC, m.menu_name;

-- View untuk analisis menu yang paling sering diubah izin aksesnya
CREATE OR REPLACE VIEW vw_frequently_modified_menu_permissions AS
SELECT 
    m.menu_id,
    m.menu_name,
    m.path,
    COALESCE(p.menu_name, 'Main Menu') AS parent_menu,
    COUNT(DISTINCT rm.role_menu_id) AS total_role_assignments,
    COUNT(DISTINCT rm.role_id) AS total_roles,
    MAX(rm.updated_at) AS last_modified,
    STRING_AGG(DISTINCT r.nama_role, ', ') AS assigned_roles
FROM menu m
LEFT JOIN menu p ON m.parent_id = p.menu_id
JOIN role_menu rm ON m.menu_id = rm.menu_id
JOIN roles r ON rm.role_id = r.role_id
GROUP BY m.menu_id, m.menu_name, m.path, p.menu_name
ORDER BY last_modified DESC, m.menu_name;

-- View untuk analisis role dengan izin akses paling banyak
CREATE OR REPLACE VIEW vw_role_permission_strength AS
SELECT 
    r.role_id,
    r.nama_role,
    r.display_name,
    COUNT(DISTINCT rm.menu_id) AS total_menus,
    SUM(CASE WHEN rm.can_view = true THEN 1 ELSE 0 END) AS view_permissions,
    SUM(CASE WHEN rm.can_create = true THEN 1 ELSE 0 END) AS create_permissions,
    SUM(CASE WHEN rm.can_edit = true THEN 1 ELSE 0 END) AS edit_permissions,
    SUM(CASE WHEN rm.can_delete = true THEN 1 ELSE 0 END) AS delete_permissions,
    SUM(CASE WHEN rm.can_view = true THEN 1 ELSE 0 END) + 
    SUM(CASE WHEN rm.can_create = true THEN 1 ELSE 0 END) + 
    SUM(CASE WHEN rm.can_edit = true THEN 1 ELSE 0 END) + 
    SUM(CASE WHEN rm.can_delete = true THEN 1 ELSE 0 END) AS total_permissions,
    ROUND(
        (SUM(CASE WHEN rm.can_view = true THEN 1 ELSE 0 END) + 
         SUM(CASE WHEN rm.can_create = true THEN 1 ELSE 0 END) + 
         SUM(CASE WHEN rm.can_edit = true THEN 1 ELSE 0 END) + 
         SUM(CASE WHEN rm.can_delete = true THEN 1 ELSE 0 END))::numeric / 
        (COUNT(DISTINCT rm.menu_id) * 4) * 100, 2
    ) AS permission_strength_percentage
FROM roles r
LEFT JOIN role_menu rm ON r.role_id = rm.role_id
GROUP BY r.role_id, r.nama_role, r.display_name
ORDER BY permission_strength_percentage DESC, r.nama_role;

-- View untuk dashboard ringkasan sistem menu dan role
CREATE OR REPLACE VIEW vw_menu_role_system_summary AS
SELECT
    (SELECT COUNT(*) FROM roles WHERE status = 'aktif') AS active_roles,
    (SELECT COUNT(*) FROM menu WHERE is_active = true) AS active_menus,
    (SELECT COUNT(*) FROM menu WHERE parent_id IS NULL AND is_active = true) AS parent_menus,
    (SELECT COUNT(*) FROM menu WHERE parent_id IS NOT NULL AND is_active = true) AS child_menus,
    (SELECT COUNT(*) FROM role_menu) AS role_menu_assignments,
    (SELECT COUNT(*) FROM role_menu WHERE can_view = true) AS view_permissions,
    (SELECT COUNT(*) FROM role_menu WHERE can_create = true) AS create_permissions,
    (SELECT COUNT(*) FROM role_menu WHERE can_edit = true) AS edit_permissions,
    (SELECT COUNT(*) FROM role_menu WHERE can_delete = true) AS delete_permissions,
    (SELECT MAX(updated_at) FROM role_menu) AS last_permission_update,
    (SELECT MAX(updated_at) FROM menu) AS last_menu_update,
    (SELECT MAX(updated_at) FROM roles) AS last_role_update;