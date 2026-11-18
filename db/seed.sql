-- Przykładowe produkty. Możesz uruchomić skrypt kilka razy bez duplikatów.
INSERT INTO products (name, description, category, price, stock, image_url, sku)
VALUES
 ('Słuchawki bezprzewodowe Nova', 'Bezprzewodowe słuchawki z aktywną redukcją szumów i etui ładującym.', 'Elektronika', 349.00, 24, '', 'NOVA-001'),
 ('Lampka biurkowa Arc', 'Minimalistyczna lampka LED z regulacją jasności.', 'Dom i ogród', 189.00, 18, '', 'ARC-002'),
 ('Plecak miejski Orbit', 'Lekki plecak na laptopa 15 cali z wodoodporną powłoką.', 'Moda', 259.00, 32, '', 'ORBIT-003'),
 ('Klawiatura mechaniczna Type', 'Kompaktowa klawiatura z przełącznikami mechanicznymi i podświetleniem.', 'Elektronika', 429.00, 12, '', 'TYPE-004'),
 ('Bidon termiczny Flow', 'Stalowy bidon o pojemności 750 ml, utrzymuje temperaturę przez wiele godzin.', 'Sport', 99.00, 56, '', 'FLOW-005'),
 ('Organizer na biurko Grid', 'Modułowy organizer na przybory i drobne akcesoria.', 'Biuro', 79.00, 41, '', 'GRID-006'),
 ('Mata do jogi Balance', 'Antypoślizgowa mata treningowa o grubości 6 mm.', 'Sport', 139.00, 27, '', 'BALANCE-007'),
 ('Głośnik Bluetooth Echo', 'Przenośny głośnik z mocnym basem i wodoodpornością IPX7.', 'Elektronika', 219.00, 16, '', 'ECHO-008')
ON CONFLICT (sku) DO NOTHING;
