// Catálogo inicial cargado desde "lista de precios nueva.pdf" (PRECIOS.xlsx tiene esa lista
// pegada como imagen). Solo se usa para crear productos.xlsx la primera vez: después los
// precios, el stock y las imágenes se editan directamente en el Excel.
// Donde la lista tiene dos precios (+ de 20 / - de 20, efectivo) se tomó el de menos de 20 / sin descuento.
// Formato: [categoría, prefijo del id, [[nombre, presentación, precio, aroma?, descripción?, precio por mayor?], ...]]

const INCLUYE_BIDON = 'Incluye bidón.';
const SIN_BIDON = 'No incluye bidón.';
const LINK_USO = 'Pedinos por WhatsApp la función y el modo de uso.';

const desodorante = (aroma, cuarto, medio, litro) => [
  [`Desodorante ${aroma}`, '¼ L', cuarto, aroma],
  [`Desodorante ${aroma}`, '½ L', medio, aroma],
  [`Desodorante ${aroma}`, '1 L', litro, aroma],
];

const fragancia = (aroma, medio, cinco) => [
  [`Fragancia ${aroma}`, '½ L', medio, aroma],
  [`Fragancia ${aroma}`, '5 L', cinco, aroma, 'Los pedidos de 5 L se hacen con anticipación.'],
];

// Perfumes textiles: cada fragancia en todos los tamaños. Precios del dueño (no de la lista):
// 125 cc y 250 cc tienen precio por mayor desde 6 unidades, combinando fragancias.
const FRAGANCIAS_TEXTILES = [
  'Vivex', 'Arpege', 'Coniglio', 'Vainicoco', 'Sandía y frambuesa', 'Chicle', 'Uva', 'Cool Water',
  'Uva y frutos del bosque', 'Hindú', 'Conforth', 'Citrus', 'Bebé', 'Kosiuko', 'Daniels',
  'Carolina Herrera hombre',
];
// [presentación, precio, precio por mayor, descripción]
const TAMANOS_TEXTILES = [
  ['125 cc', 2500, 2000], ['250 cc', 3500, 3000], ['½ L', 7000], ['1 L', 10000], ['5 L', 40000, '', INCLUYE_BIDON],
];
const perfumesTextiles = FRAGANCIAS_TEXTILES.flatMap((aroma) =>
  TAMANOS_TEXTILES.map(([tamano, precio, precioMayor = '', descripcion = '']) =>
    [`Perfume textil ${aroma}`, tamano, precio, aroma, descripcion, precioMayor]));

const LISTA = [
  ['Piscinas', 'PIS', [
    ['Cloro', '1 L', 688.80, '', `${SIN_BIDON} Precio por litro.`],
    ['Pastillas triple acción', '1 kg', 8636.86],
    ['Alguicida', '5 L', 16155.80, '', INCLUYE_BIDON],
    ['Clarificador', '1 L', 3795.00],
    ['Regulador de pH', '1 L', 1797.00],
    ['Regulador de pH concentrado', '1 L', 5470.01],
    ['Ácido muriático', '1 L', 7865.00, '', SIN_BIDON],
    ['Ácido muriático 19% concentrado', '5 L', 23687.28],
    ['Cloro granulado lenta/rápida', '1 kg', 6804.80],
  ]],
  ['Limpieza', 'LIM', [
    ['Detergente al 30%', '1 kg', 4580.00, '', SIN_BIDON],
    ['Detergente al 20%', '1 kg', 3155.00, '', SIN_BIDON],
    ['Desengrasante', '½ L', 4459.00],
    ['Desengrasante', '1 L', 8380.00],
    ['Desengrasante', '5 L', 39582.00, '', INCLUYE_BIDON],
    ['Colorante verde', '½ L', 2663.40],
    ['Colorante amarillo', '½ L', 3110.86],
    ['Limpiador cremoso tipo CIF', '5 L', 7896.00, '', INCLUYE_BIDON],
    ['Alcohol en gel', '5 L', 10925.80, '', INCLUYE_BIDON],
    ['Sanitizante', '5 L', 12360.15, '', INCLUYE_BIDON],
    ['Ódex con amoníaco', '1 L', 1722.00],
    ['Multiuso', '5 L', 4666.00, '', INCLUYE_BIDON],
    ['Limpiavidrios', '5 L', 7430.65, '', INCLUYE_BIDON],
    ['Agua destilada', '1 L', 502.53, '', SIN_BIDON],
    ['Quitasarro', '1 L', 4109.00],
    ['Procenex', '1 L', 4375.30, '', 'Rinde 1 en 19 de agua.'],
    ['Repelente', '½ L', 3041.14],
    ['Repelente', '5 L', 24844.16, '', INCLUYE_BIDON],
    ['Amonio cuaternario', '½ L', 9309.86],
  ]],
  ['Desodorantes', 'DES', [
    ...desodorante('Arpege 16', 3202, 6311, 12085),
    ...desodorante('Chicle', 4654, 9215, 17891),
    ...desodorante('Citronella (rosa y/o blanca)', 4648, 9204, 17870),
    ...desodorante('Colonia Bebé', 2756, 5106, 9806),
    ...desodorante('Colonia Inglesa', 4990, 9888, 19237),
    ...desodorante('Frutilla', 2814, 5536, 10533),
    ...desodorante('Lavanda', 5219, 10347, 20155),
    ...desodorante('Lavanda tipo Poett', 3033, 5973, 11407),
    ...desodorante('Limón', 3992, 7892, 15246),
    ...desodorante('Lysoform', 3140, 6188, 11838),
    ...desodorante('Marina', 3424, 6755, 12972),
    ...desodorante('Oriental', 4601, 9110, 17681),
    ...desodorante('Pino', 3008, 5924, 11310),
    ...desodorante('Pinoluz', 3499, 6906, 13274),
    ...desodorante('Vainilla', 2673, 5243, 9887),
  ]],
  ['Ceras', 'CER', [
    ['Cera negra', '5 L', 12927.00, '', INCLUYE_BIDON],
    ['Cera roja', '5 L', 13625.00, '', INCLUYE_BIDON],
    ['Cera incolora', '1 L', 2024.00, '', SIN_BIDON],
  ]],
  ['Lavado de ropa', 'ROP', [
    ['Suavizante tipo Vivex', '1 L', 810.26, '', `${SIN_BIDON} Precio por litro.`],
    ['Suavizante Ropa Limpia', '1 L', 547.07, '', `${SIN_BIDON} Precio por litro.`],
    ['Jabón líquido ultra azul', '1 L', 1461.41, '', `${SIN_BIDON} Precio por litro.`],
    ['Jabón líquido eco verde', '1 L', 815.60, '', `${SIN_BIDON} Precio por litro.`],
    ['Jabón en polvo', 'Bolsa 5 kg', 11587.50],
    ['Desmanchador', '1 L', 8380.00],
    ['Desmanchador', '½ L', 4459.00],
  ]],
  ['Lavandinas', 'LVA', [
    ['Lavandina ropa blanca', '5 L', 3638.50, '', INCLUYE_BIDON],
    ['Lavandina ropa color', '1 L', 616.80, '', `${SIN_BIDON} Mínimo 5 L.`],
    ['Lavandina en gel', '5 L', 5349.35, '', INCLUYE_BIDON],
  ]],
  ['Alcohol isopropílico', 'ALC', [
    ['Alcohol isopropílico 99%', '½ L', 4519.00, '', LINK_USO],
    ['Alcohol isopropílico 99%', '1 L', 8884.00, '', LINK_USO],
    ['Alcohol isopropílico 99%', '5 L', 43529.00, '', `${INCLUYE_BIDON} ${LINK_USO}`],
  ]],
  ['Higiene personal', 'HIG', [
    ['Shampoo para cabellos Algas', '5 L', 7493.00, 'Algas', INCLUYE_BIDON],
    ['Shampoo para cabellos Neutro', '5 L', 6358.00, '', INCLUYE_BIDON],
    ['Shampoo para cabellos Rosa Mosqueta', '5 L', 8718.00, 'Rosa mosqueta', INCLUYE_BIDON],
    ['Shampoo para cabellos Hierbas', '5 L', 8718.00, 'Hierbas', INCLUYE_BIDON],
    ['Crema de enjuague Bálsamo', '5 L', 8233.55, '', INCLUYE_BIDON],
    ['Crema de enjuague Proteínas', '5 L', 8233.55, '', INCLUYE_BIDON],
    ['Jabón líquido para manos Vainilla', '5 L', 7376.00, 'Vainilla', INCLUYE_BIDON],
    // "Jabón líquido para manos Campestre" figura sin stock y sin precio en la lista.
  ]],
  ['Ácido cítrico, bicarbonato y percarbonato', 'QUI', [
    ['Ácido cítrico', '1 kg', 4089.00],
    ['Ácido cítrico', '3 kg', 10515.00],
    ['Ácido cítrico', '25 kg', 84700.00],
    ['Bicarbonato', '1 kg', 2991.12],
    ['Bicarbonato', 'Bolsa 25 kg', 63561.30],
    ['Percarbonato (oxi power en polvo tipo Vanish)', '1 kg', 7318.90, '', LINK_USO],
    ['Percarbonato (oxi power en polvo tipo Vanish)', '5 kg', 31546.95, '', LINK_USO],
    ['Percarbonato (oxi power en polvo tipo Vanish)', '20 kg', 121140.40, '', LINK_USO],
  ]],
  ['Autos', 'AUT', [
    ['Silicona', '1 L', 7252.00],
    ['Silicona', '½ L', 3714.00],
    ['Silicona', '¼ L', 2007.00],
    ['Shampoo siliconado', '5 L', 15448.00, '', INCLUYE_BIDON],
    ['Renovador', '1 L', 7224.00],
    ['Renovador', '½ L', 3700.00],
    ['Renovador', '¼ L', 2000.00],
  ]],
  ['Envases y afines', 'ENV', [
    ['Atomizador', '100 cc', 882.00],
    ['Atomizador con gatillo', '250 cc', 1470.84],
    ['Atomizador spray', '250 cc', 890.00],
    ['Jabonera', '250 cc', 1055.00],
    ['Gatillo universal', 'Unidad', 992.00],
    ['Bidón', '5 L', 889.00],
    ['Bidón', '10 L', 1791.00],
    ['Tapa de bidón', 'Unidad', 64.00],
    ['Botella con tapa', '¼ L', 305.00],
    ['Botella con tapa', '½ L', 533.00],
    ['Botella con tapa', '1 L', 617.00],
  ]],
  ['Perfumes para ropa', 'PER', [
    ...perfumesTextiles,
  ]],
  ['Difusores ambientales', 'DIF', [
    ['Varillas para difusor', 'Paquete x 80', 1037.00],
    ['Envase para difusor', '125 cc', 1047.00],
    ...fragancia('Coco', 4485, 42742),
    ...fragancia('Coniglio', 7758, 75469),
    ...fragancia('Hindú', 9029, 88181),
    ...fragancia('Lemon grass', 5652, 54408),
    ...fragancia('Marea', 6557, 63458),
    ...fragancia('Naranja pomelo', 7641, 74301),
    ...fragancia('Primavera', 6235, 60240),
    ...fragancia('Uva', 6353, 61418),
    ...fragancia('Vainilla', 2880, 26695),
  ]],
  ['Rubro industrial', 'IND', [
    ['Convertidor de óxido', '1 L', 3339.00, '', LINK_USO],
    ['Convertidor de óxido', '5 L', 12348.00, '', `${INCLUYE_BIDON} ${LINK_USO}`],
    ['Diluyente de óxido', '½ L', 1728.00, '', LINK_USO],
    ['Diluyente de óxido', '1 L', 2862.00, '', LINK_USO],
    ['Diluyente de óxido', '5 L', 13124.00, '', `${INCLUYE_BIDON} ${LINK_USO}`],
  ]],
];

// stock vacío = 0 = "Sin stock" en la web hasta que el dueño lo cargue.
export const CATALOGO_INICIAL = LISTA.flatMap(([categoria, prefijo, items]) =>
  items.map(([nombre, presentacion, precio, aroma = '', descripcion = '', precioMayor = ''], i) => ({
    id: `${prefijo}-${String(i + 1).padStart(2, '0')}`,
    categoria,
    nombre,
    presentacion,
    aroma,
    descripcion,
    precio,
    precio_mayor: precioMayor,
    mayor_desde: precioMayor ? 6 : '',
    stock: 0,
    imagen_url: '',
    activo: 'si',
  })));
