-- View untuk menampilkan data menu untuk navigasi sidebar
CREATE OR REPLACE VIEW vw_sidebar_navigation AS
WITH parent_menus AS (
    SELECT 
        m.menu_id,
        m.menu_name,
        m.path,
        m.icon,
        m.order_index,
        m.is_active
    FROM menu m
    WHERE m.parent_id IS NULL AND m.is_active = true
    ORDER BY m.order_index
)
SELECT 
    pm.menu_id AS parent_id,
    pm.menu_name AS parent_name,
    pm.path AS parent_path,
    pm.icon AS parent_icon,
    pm.order_index AS parent_order,
    cm.menu_id AS child_id,
    cm.menu_name AS child_name,
    cm.path AS child_path,
    cm.icon AS child_icon,
    cm.order_index AS child_order,
    cm.is_active AS child_active
FROM parent_menus pm
LEFT JOIN menu cm ON pm.menu_id = cm.parent_id AND cm.is_active = true
ORDER BY pm.order_index, pm.menu_name, cm.order_index, cm.menu_name;

-- View untuk menampilkan data menu untuk role tertentu (untuk navigasi sidebar berdasarkan role)
CREATE OR REPLACE VIEW vw_role_sidebar_navigation AS
WITH role_parent_menus AS (
    SELECT DISTINCT
        r.role_id,
        r.nama_role,
        r.display_name AS role_display_name,
        m.menu_id,
        m.menu_name,
        m.path,
        m.icon,
        m.order_index,
        m.is_active
    FROM roles r
    JOIN role_menu rm ON r.role_id = rm.role_id
    JOIN menu m ON rm.menu_id = m.menu_id
    WHERE m.parent_id IS NULL AND m.is_active = true AND rm.can_view = true
    ORDER BY m.order_index
)
SELECT 
    rpm.role_id,
    rpm.nama_role,
    rpm.role_display_name,
    rpm.menu_id AS parent_id,
    rpm.menu_name AS parent_name,
    rpm.path AS parent_path,
    rpm.icon AS parent_icon,
    rpm.order_index AS parent_order,
    cm.menu_id AS child_id,
    cm.menu_name AS child_name,
    cm.path AS child_path,
    cm.icon AS child_icon,
    cm.order_index AS child_order,
    CASE WHEN crm.can_view IS NULL THEN false ELSE crm.can_view END AS has_view_permission
FROM role_parent_menus rpm
LEFT JOIN menu cm ON rpm.menu_id = cm.parent_id AND cm.is_active = true
LEFT JOIN role_menu crm ON rpm.role_id = crm.role_id AND cm.menu_id = crm.menu_id
ORDER BY rpm.role_id, rpm.order_index, rpm.menu_name, cm.order_index, cm.menu_name;

-- View untuk menampilkan statistik penggunaan menu berdasarkan role
CREATE OR REPLACE VIEW vw_menu_usage_statistics AS
SELECT 
    m.menu_id,
    m.menu_name,
    m.path,
    m.icon,
    COALESCE(p.menu_name, 'Main Menu') AS parent_menu,
    m.order_index,
    m.is_active,
    COUNT(DISTINCT rm.role_id) AS assigned_roles_count,
    SUM(CASE WHEN rm.can_view = true THEN 1 ELSE 0 END) AS view_permissions_count,
    SUM(CASE WHEN rm.can_create = true THEN 1 ELSE 0 END) AS create_permissions_count,
    SUM(CASE WHEN rm.can_edit = true THEN 1 ELSE 0 END) AS edit_permissions_count,
    SUM(CASE WHEN rm.can_delete = true THEN 1 ELSE 0 END) AS delete_permissions_count
FROM menu m
LEFT JOIN menu p ON m.parent_id = p.menu_id
LEFT JOIN role_menu rm ON m.menu_id = rm.menu_id
GROUP BY m.menu_id, m.menu_name, m.path, m.icon, p.menu_name, m.order_index, m.is_active
ORDER BY assigned_roles_count DESC, m.order_index, m.menu_name;

-- View untuk menampilkan menu yang paling banyak diberikan izin akses
CREATE OR REPLACE VIEW vw_most_accessed_menu AS
SELECT 
    m.menu_id,
    m.menu_name,
    m.path,
    m.icon,
    COALESCE(p.menu_name, 'Main Menu') AS parent_menu,
    COUNT(DISTINCT rm.role_id) AS role_count,
    STRING_AGG(DISTINCT r.nama_role, ', ') AS assigned_roles
FROM menu m
LEFT JOIN menu p ON m.parent_id = p.menu_id
LEFT JOIN role_menu rm ON m.menu_id = rm.menu_id
LEFT JOIN roles r ON rm.role_id = r.role_id
WHERE rm.can_view = true
GROUP BY m.menu_id, m.menu_name, m.path, m.icon, p.menu_name
ORDER BY role_count DESC, m.menu_name;

-- View untuk menampilkan data menu dalam format JSON untuk API
CREATE OR REPLACE VIEW vw_menu_json AS
WITH parent_menus AS (
    SELECT 
        m.menu_id,
        m.menu_name,
        m.path,
        m.icon,
        m.order_index,
        m.is_active
    FROM menu m
    WHERE m.parent_id IS NULL
    ORDER BY m.order_index
)
SELECT 
    pm.menu_id,
    pm.menu_name,
    pm.path,
    pm.icon,
    pm.order_index,
    pm.is_active,
    COALESCE(
        json_agg(
            json_build_object(
                'menu_id', cm.menu_id,
                'menu_name', cm.menu_name,
                'path', cm.path,
                'icon', cm.icon,
                'order_index', cm.order_index,
                'is_active', cm.is_active
            ) ORDER BY cm.order_index, cm.menu_name
        ) FILTER (WHERE cm.menu_id IS NOT NULL),
        '[]'::json
    ) AS children
FROM parent_menus pm
LEFT JOIN menu cm ON pm.menu_id = cm.parent_id
GROUP BY pm.menu_id, pm.menu_name, pm.path, pm.icon, pm.order_index, pm.is_active
ORDER BY pm.order_index, pm.menu_name;

-- View untuk menampilkan data menu dan izin akses dalam format JSON untuk API berdasarkan role
CREATE OR REPLACE VIEW vw_role_menu_json AS
SELECT 
    r.role_id,
    r.nama_role,
    r.display_name,
    COALESCE(
        json_agg(
            json_build_object(
                'menu_id', m.menu_id,
                'menu_name', m.menu_name,
                'path', m.path,
                'icon', m.icon,
                'parent_id', m.parent_id,
                'order_index', m.order_index,
                'is_active', m.is_active,
                'permissions', json_build_object(
                    'can_view', rm.can_view,
                    'can_create', rm.can_create,
                    'can_edit', rm.can_edit,
                    'can_delete', rm.can_delete
                )
            ) ORDER BY m.order_index, m.menu_name
        ) FILTER (WHERE m.menu_id IS NOT NULL),
        '[]'::json
    ) AS menus
FROM roles r
LEFT JOIN role_menu rm ON r.role_id = rm.role_id
LEFT JOIN menu m ON rm.menu_id = m.menu_id
GROUP BY r.role_id, r.nama_role, r.display_name
ORDER BY r.nama_role;