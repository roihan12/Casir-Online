-- View untuk menampilkan struktur menu dengan hierarki
CREATE OR REPLACE VIEW vw_menu_hierarchy AS
WITH RECURSIVE menu_tree AS (
    -- Base case: menu level 1 (parent menu)
    SELECT 
        m.menu_id,
        m.menu_name,
        m.path,
        m.icon,
        m.parent_id,
        m.order_index,
        m.is_active,
        CAST(m.menu_name AS VARCHAR(1000)) AS menu_path,
        1 AS level
    FROM menu m
    WHERE m.parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child menus
    SELECT 
        m.menu_id,
        m.menu_name,
        m.path,
        m.icon,
        m.parent_id,
        m.order_index,
        m.is_active,
        CAST(mt.menu_path || ' > ' || m.menu_name AS VARCHAR(1000)) AS menu_path,
        mt.level + 1 AS level
    FROM menu m
    JOIN menu_tree mt ON m.parent_id = mt.menu_id
)
SELECT 
    menu_id,
    menu_name,
    path,
    icon,
    parent_id,
    order_index,
    is_active,
    menu_path,
    level
FROM menu_tree
ORDER BY level, order_index, menu_name;

-- View untuk menampilkan daftar role dengan jumlah menu yang dimiliki
CREATE OR REPLACE VIEW vw_role_menu_summary AS
SELECT 
    r.role_id,
    r.nama_role,
    r.display_name,
    r.deskripsi,
    r.status,
    COUNT(rm.menu_id) AS total_menus,
    SUM(CASE WHEN rm.can_view = true THEN 1 ELSE 0 END) AS view_permissions,
    SUM(CASE WHEN rm.can_create = true THEN 1 ELSE 0 END) AS create_permissions,
    SUM(CASE WHEN rm.can_edit = true THEN 1 ELSE 0 END) AS edit_permissions,
    SUM(CASE WHEN rm.can_delete = true THEN 1 ELSE 0 END) AS delete_permissions
FROM roles r
LEFT JOIN role_menu rm ON r.role_id = rm.role_id
GROUP BY r.role_id, r.nama_role, r.display_name, r.deskripsi, r.status
ORDER BY r.nama_role;

-- View untuk menampilkan detail izin akses menu untuk setiap role
CREATE OR REPLACE VIEW vw_role_menu_permissions AS
SELECT 
    r.role_id,
    r.nama_role,
    r.display_name AS role_display_name,
    m.menu_id,
    m.menu_name,
    m.path,
    m.icon,
    COALESCE(p.menu_name, 'Main Menu') AS parent_menu,
    m.order_index,
    rm.can_view,
    rm.can_create,
    rm.can_edit,
    rm.can_delete,
    CASE 
        WHEN rm.can_view = true AND rm.can_create = true AND rm.can_edit = true AND rm.can_delete = true THEN 'Full Access'
        WHEN rm.can_view = true AND rm.can_create = false AND rm.can_edit = false AND rm.can_delete = false THEN 'View Only'
        WHEN rm.can_view = true THEN 'Partial Access'
        ELSE 'No Access'
    END AS access_level
FROM roles r
JOIN role_menu rm ON r.role_id = rm.role_id
JOIN menu m ON rm.menu_id = m.menu_id
LEFT JOIN menu p ON m.parent_id = p.menu_id
ORDER BY r.nama_role, p.menu_name, m.order_index, m.menu_name;

-- View untuk menampilkan menu yang tersedia untuk setiap role
CREATE OR REPLACE VIEW vw_available_menu_by_role AS
SELECT 
    r.role_id,
    r.nama_role,
    r.display_name AS role_display_name,
    m.menu_id,
    m.menu_name,
    m.path,
    m.icon,
    m.parent_id,
    m.order_index,
    m.is_active,
    rm.can_view,
    rm.can_create,
    rm.can_edit,
    rm.can_delete
FROM roles r
JOIN role_menu rm ON r.role_id = rm.role_id
JOIN menu m ON rm.menu_id = m.menu_id
WHERE rm.can_view = true AND m.is_active = true
ORDER BY r.nama_role, m.order_index, m.menu_name;

-- View untuk menampilkan menu yang belum diberikan ke role tertentu
CREATE OR REPLACE VIEW vw_unassigned_menu_by_role AS
SELECT 
    r.role_id,
    r.nama_role,
    r.display_name AS role_display_name,
    m.menu_id,
    m.menu_name,
    m.path,
    m.icon,
    m.parent_id,
    m.order_index,
    m.is_active
FROM roles r
CROSS JOIN menu m
WHERE NOT EXISTS (
    SELECT 1 FROM role_menu rm 
    WHERE rm.role_id = r.role_id AND rm.menu_id = m.menu_id
)
ORDER BY r.nama_role, m.order_index, m.menu_name;