# **Entrega 1 - Semana 3 Arquitectura del Software** 



<!-- Start of picture text -->
POLITECNICO<br>GRANCOLOMBIANO<br><!-- End of picture text -->

Leydi Viviana Loaiza Cardona Jorge Hernán Caicedo Garcia Jairo Ernesto Giraldo Cardona 

Natalia Martínez Rojas 

Politécnico Grancolombiano 

Grupo de trabajo 1 28 de septiembre de 2026 

### **Situación problema** 

#### **Contexto y delimitación** 

El proyecto se desarrolla sobre un escenario académico denominado _BankPoli_ , correspondiente a una entidad financiera mediana de banca minorista. La organización dispone de un núcleo transaccional central que concentra capacidades relacionadas con clientes, cuentas y operaciones financieras. Debido a la evolución progresiva de la plataforma, parte de estas capacidades se encuentra soportada por sistemas heredados ( _legacy_ ) que deben continuar operando mientras se incorporan nuevos canales digitales y servicios. 

El escenario representa una problemática real y recurrente en procesos de modernización de sistemas financieros: la necesidad de integrar capacidades existentes con nuevas aplicaciones mediante interfaces estandarizadas y reutilizables. El análisis se delimita a la gestión de **transferencias interbancarias** , operación que requiere la interacción entre diferentes componentes y permite evidenciar problemas de interoperabilidad y acoplamiento. 

En este flujo intervienen los servicios de autenticación y gestión de usuarios, consulta de cuentas, transferencias y notificaciones, además del núcleo transaccional y los mecanismos de integración con entidades financieras externas. La aplicación móvil y el portal web actúan como consumidores, mientras que los servicios internos, el núcleo transaccional y los sistemas externos participan como proveedores de las capacidades requeridas. La interoperabilidad financiera exige compatibilidad técnica, semántica y de negocio entre los sistemas involucrados (Boar et al., 2021), mientras que las APIs constituyen mecanismos relevantes para facilitar la comunicación estandarizada entre servicios (Bank for International Settlements, 2020). 

#### **Funcionamiento actual, fallo y consecuencias** 

Actualmente, los canales digitales requieren acceder a las capacidades del núcleo transaccional mediante mecanismos de integración que pueden variar según el consumidor. En el proceso de una transferencia interbancaria se consultan las cuentas, se validan los datos de la operación y se procesa la transacción mediante el núcleo y los mecanismos de integración correspondientes. 

El fallo identificado es el **acoplamiento entre los consumidores y las implementaciones de los sistemas que proporcionan las capacidades financieras** . Las conexiones punto a punto, interfaces heterogéneas y dependencias directas pueden provocar que un cambio realizado en un sistema proveedor obligue a modificar uno o varios consumidores. Esto incrementa la complejidad de mantenimiento y dificulta la incorporación de nuevos canales y servicios. 

Entre las principales causas se encuentran las integraciones punto a punto, la dependencia de detalles de implementación, la falta de interfaces uniformes, la dificultad para reutilizar capacidades y la permanencia de sistemas heredados. Como consecuencias se presentan mayor esfuerzo de mantenimiento, dificultad para incorporar nuevos canales, duplicidad de integraciones y dependencia de tecnologías específicas. En el contexto financiero, estas condiciones pueden aumentar los tiempos y costos de evolución de los servicios. 

Desde la perspectiva SOA, la problemática resulta pertinente porque una arquitectura orientada a servicios permite organizar capacidades de negocio como servicios accesibles mediante interfaces y contratos, favoreciendo la reutilización y reduciendo dependencias directas entre consumidores e implementaciones (Erl, 2009). Por ello, el análisis deberá considerar los servicios, interfaces, consumidores, proveedores y mecanismos de descubrimiento involucrados. 

1 

### **Referentes académicos y técnicos** 

Bass, Clements y Kazman (2012) plantean que la arquitectura de software define la estructura de un sistema y las interacciones entre sus elementos, por lo que las decisiones arquitectónicas tienen efectos sobre atributos de calidad como mantenibilidad y modificabilidad (Bass et al., 2012). Este referente permite analizar el acoplamiento y la evolución de la arquitectura de _BankPoli_ . 

Erl (2009) presenta patrones de diseño específicos para arquitecturas orientadas a servicios, incluyendo alternativas relacionadas con sistemas heredados, contratos y encapsulación de capacidades (Erl, 2009). Por su relación directa con la problemática, constituye el principal referente para la identificación preliminar de patrones. 

En el ámbito financiero, Boar et al. (2021) destacan la importancia de la compatibilidad técnica, semántica y de negocio para la interoperabilidad entre sistemas de pago (Boar et al., 2021). De forma complementaria, el Banco de Pagos Internacionales señala el papel de las APIs como mecanismos para facilitar la comunicación e interoperabilidad de servicios financieros (Bank for International Settlements, 2020). Project Aperta constituye además un referente técnico sobre interoperabilidad financiera mediante APIs (Bank for International Settlements, 2026). 

Finalmente, Richardson y Ruby (2007) presentan fundamentos para el diseño de servicios REST mediante HTTP, URI, representaciones y códigos de respuesta (Richardson & Ruby, 2007). Este referente servirá como base para la implementación prevista en la tercera entrega. 

### **Identificación preliminar de patrones** 

A partir de la problemática identificada se consideran tres patrones de arquitectura orientada a servicios potencialmente aplicables. Esta identificación es preliminar y no implica la selección del patrón definitivo, la cual se realizará en la segunda entrega. 

#### **_Legacy Wrapper_** 

El patrón _Legacy Wrapper_ permite encapsular las capacidades de un sistema heredado mediante una interfaz de servicio, evitando que los consumidores dependan directamente de los detalles de su implementación (Erl, 2009). 

Podría ser pertinente para _BankPoli_ porque parte de las capacidades del núcleo transaccional corresponde a sistemas heredados que deben continuar funcionando. Su aplicación permitiría exponer la capacidad de transferencias mediante una interfaz de servicio y reducir la dependencia de los consumidores respecto de la tecnología existente, sin requerir el reemplazo inmediato del sistema heredado. 

#### **_Decoupled Contract_** 

El patrón _Decoupled Contract_ busca disminuir la dependencia entre consumidores y proveedores mediante contratos que separan la interacción de los detalles específicos de implementación (Erl, 2009). 

Podría ser pertinente debido al acoplamiento identificado entre los canales digitales y el núcleo transaccional. Un contrato desacoplado permitiría que diferentes consumidores utilicen una mis- 

2 

ma capacidad mediante una interfaz definida, reduciendo la dependencia respecto de la estructura interna del proveedor y facilitando la evolución de los servicios. 

#### **_Service Façade_** 

El patrón _Service Façade_ incorpora una fachada entre el contrato de un servicio y su lógica interna, reduciendo la exposición de particularidades de implementación (Erl, 2009). 

Podría ser pertinente porque la aplicación móvil y el portal web requieren acceder a capacidades financieras similares. Una fachada podría proporcionar un punto de interacción uniforme y ocultar particularidades técnicas del núcleo transaccional, facilitando la evolución de la implementación sin afectar directamente a los consumidores. 

Los tres patrones presentan una relación potencial con las causas identificadas. Sin embargo, **no se selecciona todavía un patrón definitivo** ; la decisión se realizará en la segunda entrega después de analizar los servicios, interfaces, proveedores, registro de servicios y atributos de calidad. 

### **Justificación** 

La situación seleccionada merece ser analizada porque la interoperabilidad es un factor crítico cuando diferentes aplicaciones y servicios deben intercambiar información dentro de una organización financiera. En el escenario académico _BankPoli_ , las integraciones heterogéneas, la dependencia de implementaciones específicas y las conexiones punto a punto pueden aumentar el acoplamiento entre consumidores y capacidades transaccionales, dificultando el mantenimiento y la incorporación de nuevos servicios. Esta situación representa un reto recurrente en procesos de modernización de sistemas, donde deben coexistir aplicaciones existentes y nuevas soluciones digitales. 

El Banco de Pagos Internacionales señala que la interoperabilidad entre sistemas de pago requiere compatibilidad técnica, semántica y de negocio, mientras que sus estudios sobre APIs resaltan la importancia de interfaces estandarizadas para facilitar el intercambio de información y servicios (Bank for International Settlements, 2020; Boar et al., 2021). Desde la perspectiva de arquitectura de software, el análisis permitirá identificar las dependencias existentes, delimitar los servicios involucrados y establecer criterios para evaluar alternativas arquitectónicas. Asimismo, el estudio preliminar de patrones SOA permitirá relacionar las causas identificadas con soluciones potenciales como _Legacy Wrapper_ , _Decoupled Contract_ y _Service Façade_ (Erl, 2009). 

Para las siguientes entregas, este análisis servirá como base para seleccionar el patrón más pertinente, definir los componentes e interfaces de la solución y posteriormente implementar un servicio REST de transferencias simuladas. De esta manera, el proyecto permitirá contrastar la situación inicial con una propuesta orientada a servicios y valorar su aporte al desacoplamiento, la reutilización y la interoperabilidad. 

3 

### **Objetivos** 

#### **Objetivo general** 

Analizar la problemática de interoperabilidad y acoplamiento entre los sistemas involucrados en la gestión de transferencias interbancarias del escenario académico _BankPoli_ , mediante la caracterización de sus servicios, interfaces, consumidores y proveedores y la identificación preliminar de patrones de arquitectura orientada a servicios, con el propósito de establecer las bases para la selección, diseño e implementación de una solución SOA durante las tres entregas del proyecto. 

#### **Objetivos específicos** 

1. Caracterizar la situación actual de la gestión de transferencias interbancarias en el escenario _BankPoli_ , identificando los consumidores, proveedores, servicios, interfaces, dependencias y principales problemas de interoperabilidad y acoplamiento. 

2. Analizar y comparar preliminarmente patrones de arquitectura orientada a servicios potencialmente aplicables a la problemática, estableciendo criterios que permitan seleccionar y justificar en la segunda entrega el patrón que mejor responda a las necesidades identificadas. 

3. Diseñar, implementar y evaluar en un entorno académico simulado un servicio REST para representar la operación de transferencia interbancaria, contrastándolo con la situación inicial para determinar los aportes de la propuesta en términos de interoperabilidad, desacoplamiento y reutilización. 

4 

## **PARTE 2** 

### **ENTREGA PREVIA 2 - SEMANA 5** 

Análisis de componentes, modelo arquitectónico, selección de patrón y plan de implementación 

La presente sección corresponde a la segunda entrega del análisis de la implementación de una arquitectura de software orientada a servicios para el escenario académico _BankPoli_ . Esta parte toma como punto de partida la situación problema, los referentes y los patrones preliminares identificados en la primera entrega. De acuerdo con la actividad propuesta para la Semana 5, se profundiza en el estado de los componentes, se define el modelo arquitectónico, se selecciona el patrón que hará parte de la solución y se establece un plan de implementación técnica (Erl, 2009). 

### **1. Descripción detallada de los componentes y servicios** 

La problemática identificada en la primera entrega se relaciona con el acoplamiento existente entre los canales digitales de BankPoli y el núcleo transaccional heredado. En la situación inicial se presentan integraciones punto a punto, dependencia de tecnologías internas y ausencia de una interfaz uniforme para consumir las capacidades financieras. 

Para establecer cómo la arquitectura propuesta responde a esta situación, se analizan los tres componentes principales considerados en este tipo de soluciones: los servicios, el proveedor de servicios y el registro o catálogo de servicios. Este análisis permite relacionar el estado actual con la solución arquitectónica propuesta. 

#### **1.1. Servicios** 

En el escenario actual de BankPoli, las capacidades relacionadas con las operaciones financieras se encuentran fuertemente vinculadas al núcleo transaccional. Las funciones de consulta de cuentas, validación de saldos y procesamiento de transferencias dependen de implementaciones internas del sistema heredado, incluyendo estructuras de base de datos y procedimientos almacenados. 

La problemática se presenta porque los consumidores, principalmente la aplicación móvil y el portal web, no disponen de una interfaz uniforme que oculte los detalles internos de estas capacidades. Como consecuencia, una modificación en la implementación del núcleo puede afectar directamente a los consumidores que dependen de ella. 

Para la propuesta se definen los siguientes servicios principales: 

5 

Cuadro 1: Servicios definidos para la solución BankPoli 

|**Servicio**|Propósito|Funcionalidadprincipal|
|---|---|---|
|**AuthService**|Autenticación de consumi-<br>dores|Valida las credenciales del usuario y genera el<br>token JWT requerido para acceder a los servi-<br>ciosprotegidos.|
|**CuentasService**|Gestión de información de<br>cuentas|Consulta cuentas y permite verificar el estado y<br>saldo disponible de una cuenta antes de realizar<br>una operación.|
|**TransferenciasService**|Gestión de transferencias|Coordina la validación y ejecución de una<br>transferencia interbancaria y genera la respues-<br>ta correspondiente.|
|**LegacyAdapterService**|Encapsulación del sistema<br>heredado|Traduce las solicitudes del servicio REST a las<br>estructuras y operaciones requeridas por el nú-<br>cleo transaccional.|



La separación propuesta permite que cada capacidad tenga una responsabilidad identificable y que los consumidores interactúen mediante contratos estandarizados. En particular, _TransferenciasService_ constituye el servicio principal del caso de estudio, ya que representa la operación financiera seleccionada para demostrar la transformación arquitectónica. 

#### **1.2. Interfaces de los servicios** 

La interfaz de cada servicio debe facilitar su consumo sin exponer los detalles de implementación del sistema proveedor. Por esta razón, se proponen interfaces REST sobre HTTPS y mensajes representados en JSON. 

La interfaz de transferencia se define mediante el endpoint: 

```
POST/api/v1/transferencias
```

El consumidor envía una representación JSON con la información necesaria para procesar la operación: 

```
{
```

```
"cuentaOrigen":"1000123456",
```

```
"cuentaDestino":"2000654321",
```

```
"monto":250000,
```

```
"concepto":"Transferenciainterbancaria"
```

```
}
```

El servicio valida la solicitud y devuelve una representación JSON con el resultado de la operación. De esta forma, la interfaz se mantiene independiente de las estructuras internas utilizadas por el núcleo transaccional. 

6 

#### **1.3. Proveedor de servicios** 

En la arquitectura propuesta, el proveedor de servicios corresponde a la capa backend desarrollada con Node.js y NestJS. Esta capa será responsable de implementar, publicar, mantener y proteger las capacidades expuestas mediante los servicios REST. 

El proveedor no expone directamente las tablas ni los procedimientos almacenados del núcleo bancario. En su lugar, los servicios interactúan con un adaptador que encapsula la comunicación con el sistema heredado. Esta separación permite que el proveedor evolucione su implementación sin obligar a los consumidores a conocer las tecnologías utilizadas internamente. 

El proveedor tendrá las siguientes responsabilidades: 

- Implementar los servicios definidos para la solución. 

- Exponer los endpoints REST mediante NestJS. 

- Validar las solicitudes recibidas. 

- Aplicar mecanismos de autenticación y autorización. 

- Transformar los datos entre los contratos REST y las estructuras requeridas por el sistema heredado. 

Gestionar errores sin exponer información sensible de la infraestructura. 

- Mantener la documentación de los contratos mediante OpenAPI. 

#### **1.4. Registro y catálogo de servicios** 

En la situación inicial no existe un mecanismo centralizado para consultar los servicios disponibles, sus interfaces y sus contratos. Esta condición contribuye al acoplamiento y dificulta la incorporación de nuevos consumidores. 

Para la solución académica se propone utilizar **OpenAPI 3.0** para definir formalmente el contrato de la API, y **Swagger UI** como la interfaz web que permite visualizar y probar dicha especificación. NestJS permitirá generar el contrato a partir de los controladores, rutas y DTO definidos en el proyecto. 

La documentación estará disponible mediante: 

```
GET/api/docs
```

Este catálogo permitirá consultar los endpoints disponibles, métodos HTTP, parámetros, esquemas de entrada y salida y códigos de respuesta. 

Es importante delimitar que OpenAPI/Swagger UI constituye en esta propuesta un mecanismo de **catálogo y documentación de contratos** , permitiendo centralizar la información necesaria para que los consumidores conozcan y utilicen los servicios disponibles. 

7 

### **2. Modelo arquitectónico propuesto** 

#### **2.1. Arquitectura orientada a servicios con exposición mediante REST** 

La solución propuesta adopta un enfoque orientado a servicios, en el cual las funcionalidades del sistema se organizan como servicios con responsabilidades y contratos claramente definidos. Estos servicios serán expuestos mediante una API que seguirá los principios del estilo arquitectónico REST, permitiendo la comunicación entre consumidores y proveedores mediante mecanismos estandarizados de la Web. 

REST se utilizará como estilo arquitectónico para la exposición de los recursos y operaciones de la API, empleando HTTP/HTTPS como mecanismo de comunicación y JSON como formato principal para las representaciones intercambiadas. El uso de JSON corresponde a una decisión de diseño de la solución y no constituye un requisito estricto del estilo REST. Richardson y Ruby (2007) presentan los principios y niveles de madurez asociados al diseño de servicios web RESTful (Richardson & Ruby, 2007). 

La implementación se realizará mediante Node.js, utilizando NestJS y TypeScript. NestJS proporcionará la estructura para organizar controladores, módulos, servicios, DTO, validaciones, mecanismos de seguridad y componentes de integración. 

Para establecer contratos explícitos entre los consumidores y los servicios, se utilizará OpenAPI 3.x mediante el módulo `@nestjs/swagger` . La especificación permitirá centralizar la definición de los recursos, operaciones, parámetros, estructuras de solicitud y respuestas de la API, mientras que Swagger UI proporcionará una interfaz para consultar y probar dicha documentación. 

#### **2.2. Relación del modelo con la problemática** 

El modelo propuesto responde a la situación problema de BankPoli mediante las siguientes decisiones: 

1. **Separación de consumidores e implementación:** los canales digitales consumen endpoints REST sin acceder directamente a tablas o procedimientos almacenados. 

2. **Interfaz uniforme:** los servicios utilizan HTTP y JSON para proporcionar una forma homogénea de comunicación. 

3. **Encapsulación del sistema heredado:** el _LegacyAdapterService_ oculta las particularidades del núcleo bancario. 

4. **Reutilización:** la misma capacidad de negocio puede ser consumida por diferentes canales sin implementar nuevamente la lógica financiera. 

5. **Evolución independiente:** los cambios internos del núcleo pueden ser gestionados dentro de la capa de adaptación sin modificar directamente las aplicaciones consumidoras. 

La propuesta busca así transformar la integración punto a punto identificada en la primera entrega en una interacción basada en servicios y contratos estandarizados. Esta orientación es coherente con la importancia de la interoperabilidad técnica, semántica y de negocio en sistemas financieros (Boar et al., 2021). 

8 

#### **2.3. Selección de REST frente a SOAP** 

Para el desarrollo del proyecto se selecciona **REST** como mecanismo de exposición de los servicios. SOAP no será utilizado como mecanismo principal de implementación. 

La decisión se relaciona con el alcance del escenario y con la necesidad de construir una interfaz sencilla para los canales digitales. REST permite utilizar directamente HTTP, JSON, URI y métodos HTTP, mientras que NestJS proporciona soporte directo para estructurar este tipo de APIs. 

La selección de REST no implica que SOAP sea una tecnología inadecuada en términos generales. SOAP puede ser utilizado en escenarios que requieran contratos basados en WSDL, extensiones específicas de mensajería o mecanismos asociados al conjunto de estándares WS-*. Sin embargo, para el escenario académico de BankPoli se establece REST como la alternativa de implementación. 

### **3. Diagramas arquitectónicos** 

Para representar la solución se incluyen dos diagramas complementarios. El primero presenta la estructura lógica de los componentes y sus relaciones, mientras que el segundo representa el flujo temporal de una transferencia interbancaria. 

#### **3.1. Arquitectura lógica de componentes REST** 

La arquitectura lógica organiza la solución en cinco niveles principales: canales digitales, acceso a la API REST, servicios de aplicación, integración con el sistema heredado y persistencia/core transaccional. 

Los canales digitales corresponden a las aplicaciones consumidoras que interactúan con la solución mediante solicitudes HTTP/HTTPS. 

El acceso a la API REST constituye el punto de entrada a los servicios expuestos por la aplicación. En este nivel se gestionan las rutas, controladores, autenticación y demás mecanismos transversales necesarios para recibir y procesar las solicitudes de los consumidores. 

Los servicios de aplicación contienen la lógica de negocio y coordinan las operaciones requeridas para atender las solicitudes recibidas a través de la API. En este nivel se utilizan componentes como servicios, DTO, validaciones y reglas de negocio implementadas mediante NestJS. 

La capa de integración con el sistema heredado encapsula la comunicación con los sistemas existentes que deben ser consumidos por la nueva solución. Esta separación permite evitar que los detalles específicos de dichos sistemas se propaguen hacia los consumidores de la API REST. 

Finalmente, la persistencia y el core transaccional comprenden los componentes responsables del acceso a datos, persistencia, transacciones y demás operaciones relacionadas con los sistemas de información utilizados por la solución. 

La documentación y definición de los contratos de la API se gestionarán mediante OpenAPI 3.x y Swagger UI, permitiendo a los consumidores consultar los recursos, operaciones, parámetros y estructuras de solicitud y respuesta disponibles. 

9 



<!-- Start of picture text -->
ARQUITECTURA LOGICA DE COMPONENTES REST<br>(Sistema de Transferencias BankPoli)<br>ppicaeeniOS / Android)Movil Portal(Single Web BancaPage App)Personas<br>Peticiones HTTPS / JSON Peticiones HTTPS / JSON<br>NIVEL 2: ACCESO A LA API RiCape WAY / CONTROLLERS)<br>REST API Gateway & Controllers<br>(Rutas, Auth Guards, ValidationPipe DTO)<br>—<br>nvocacién Controlador REST | Consulta Saldo/Estado ~ < Expone Especificacion / U<br>TransferenciasService CuentasService Contratos OpenAPI 3.x<br>(Orquestacién Légica) (validacién y Saldos) & Interfaz Swagger Ul<br>Delegacién de Operacién Consulta Datos Legacy<br>NIVEL 4: INTEGRACION CA ar (LEGACY WRAPPER)<br>LegacyAdapterService<br>(Encapsulamiento y Mapeo DTO <-> SQL Legacy)<br>Ejecucion SQL / Stored Procedures<br>NIVEL 5: PERSISTENCIA ¥ CORE TRANSACCIONAL<br>Base de Datos Transaccional PostgreSQL<br>(Stored Procedures & Tablas de! Core Legacy)<br><!-- End of picture text -->

Figura 1: Arquitectura lógica de componentes REST propuesta para BankPoli 

_Nota._ Elaboración propia. 

#### **3.2. Flujo de interacción y secuencia** 

El segundo diagrama representa el procesamiento de una transferencia interbancaria desde la solicitud realizada por el consumidor hasta la respuesta de la API. 

10 



<!-- Start of picture text -->
DIAGRAMA DE SECUENCIA: FLUJO DE TRANSFERENCIA INTERBANCARIA<br>Procesamiento Sincrono Desacoplado via REST AP en BankPoll<br>i | vant tte Hr Peis | i i i<br>i |<br>2rten vido waond0 | H H H<br>: i : : 1, ©x€C «p_procerar.transterencia(!.)<br>: H H H {an menos carac T2765<br><!-- End of picture text -->

Figura 2: Flujo de interacción para una transferencia interbancaria 

_Nota._ Elaboración propia. 

La Figura 2 representa una interacción síncrona. El consumidor inicia la operación mediante `POST /api/v1/transferencias` . La API Gateway recibe la petición y el mecanismo de autenticación verifica el token JWT. 

Una vez autorizada la solicitud, _TransferenciasService_ ejecuta la lógica de negocio. Posteriormente, el servicio utiliza el _LegacyAdapterService_ para consultar el estado de la cuenta y ejecutar la operación requerida en el núcleo transaccional. 

El resultado se transforma nuevamente a un DTO de respuesta y se devuelve al consumidor mediante HTTP y JSON. De esta forma, el consumidor no necesita conocer las operaciones internas ejecutadas sobre el sistema heredado. 

### **4. Selección y justificación del patrón de integración** 

A partir del análisis de la arquitectura propuesta, la problemática identificada y los patrones preliminares planteados en la primera entrega, se selecciona **Legacy Wrapper** como patrón principal de integración de la solución. 

El patrón Legacy Wrapper permite encapsular las capacidades de un sistema existente median- 

11 

te una capa intermedia, evitando que los consumidores deban conocer directamente sus detalles técnicos de implementación. Esta estrategia resulta apropiada para escenarios de modernización progresiva, en los cuales se requiere exponer funcionalidades de un sistema heredado mediante una interfaz tecnológica más actual sin reemplazar inmediatamente el núcleo existente. 

Para BankPoli, el patrón permitirá conservar el núcleo transaccional existente y construir una API REST que actúe como interfaz de acceso para los canales digitales. De esta manera, los consumidores interactuarán con recursos y operaciones HTTP definidos por la API, mientras que la capa de integración se encargará de adaptar las solicitudes y respuestas a los mecanismos utilizados por el sistema heredado. 

#### **4.1. Patrón seleccionado: Legacy Wrapper** 

El patrón Legacy Wrapper incorpora una capa de adaptación entre los consumidores de la solución y las capacidades proporcionadas por un sistema heredado. 

En la solución propuesta, esta capa permitirá aislar a los consumidores de aspectos internos del sistema existente, como tablas, procedimientos almacenados, estructuras de datos o mecanismos específicos de integración. 

La API REST proporcionará una interfaz uniforme basada en HTTP/HTTPS y utilizará JSON como formato principal para las representaciones intercambiadas. Internamente, la capa de integración podrá transformar estas solicitudes y respuestas para comunicarse con el núcleo transaccional existente. 

De esta forma, la arquitectura puede representarse conceptualmente como: 

Canales digitales _−→_ API REST _−→_ Servicios de aplicación _−→_ Legacy Wrapper _−→_ Núcleo transaccional 

#### **4.2. Justificación de la selección** 

La selección del patrón se fundamenta en la relación entre la problemática identificada y la responsabilidad de la capa de adaptación: 

1. **Preservación del núcleo existente:** BankPoli requiere continuar utilizando las capacidades proporcionadas por el núcleo bancario existente. El Legacy Wrapper permite reutilizar dichas capacidades sin exigir su reemplazo inmediato. 

2. **Reducción del acoplamiento:** Los consumidores dejan de acceder directamente a tablas, procedimientos almacenados o mecanismos internos del sistema heredado. La API REST establece una interfaz independiente de estos detalles de implementación. 

3. **Interfaz uniforme:** La solución proporciona una API REST basada en HTTP/HTTPS y JSON, mediante la cual diferentes consumidores pueden acceder a las capacidades expuestas por el sistema. 

4. **Modernización progresiva:** La incorporación de la API REST permite modernizar el mecanismo de acceso al sistema existente sin realizar inicialmente una sustitución completa del núcleo transaccional. 

12 

5. **Reutilización de capacidades:** Las funcionalidades proporcionadas por el núcleo pueden ser expuestas mediante la API y utilizadas por diferentes canales digitales sin que cada consumidor tenga que implementar mecanismos particulares de acceso al sistema heredado. 

6. **Aislamiento de detalles de implementación:** Los cambios realizados en los mecanismos internos de integración pueden mantenerse aislados de los consumidores siempre que se conserve el contrato definido por la API REST. 

Por estas razones, el patrón Legacy Wrapper presenta una relación directa con la problemática identificada: la dependencia de los consumidores respecto de los mecanismos internos del sistema heredado. La capa de adaptación permite introducir una interfaz REST estable entre los consumidores y el núcleo existente, facilitando la modernización progresiva de la solución. 

#### **4.3. Patrones complementarios** 

Aunque Legacy Wrapper será el patrón principal de integración, se consideran como mecanismos complementarios **Decoupled Contract** y **Service Façade** , debido a que contribuyen a separar la interfaz expuesta por la API REST de los mecanismos internos utilizados para implementar las funcionalidades. 

Decoupled Contract contribuye a mantener separado el contrato de la API utilizado por los consumidores de los detalles de implementación interna del proveedor. En la solución propuesta, este principio se materializa mediante la definición explícita de los recursos, operaciones, parámetros y estructuras de solicitud y respuesta de la API REST, utilizando DTO y OpenAPI para formalizar y documentar dicho contrato. 

Por su parte, Service Façade permite proporcionar un punto de acceso uniforme a funcionalidades que internamente pueden requerir la participación de diferentes componentes o mecanismos del sistema. En BankPoli, este enfoque puede utilizarse para que los consumidores interactúen con una operación REST sin necesidad de conocer los diferentes componentes internos que participan en su ejecución. 

Estos mecanismos complementan al Legacy Wrapper, pero cumplen responsabilidades diferentes dentro de la solución. Legacy Wrapper se utiliza principalmente para encapsular y adaptar las capacidades del sistema heredado, mientras que Decoupled Contract y Service Façade contribuyen a separar el contrato de la implementación y simplificar el acceso a las funcionalidades expuestas mediante la API REST. 

En conjunto, los patrones permiten establecer una separación clara entre los consumidores, la interfaz REST y los mecanismos internos del sistema, manteniendo el núcleo transaccional existente aislado de los detalles de los consumidores. 

### **5. Documentación del patrón de integración según Thomas Erl (2009)** 

Tomando como referencia la estructura propuesta por Thomas Erl (2009) para la documentación de patrones orientados a servicios, se presenta la descripción del patrón de integración seleccionado mediante sus principales elementos: requerimiento, ícono, resumen, problema, solución, aplicación, impacto, principios, arquitectura y relaciones (Erl, 2009). 

13 

En este proyecto, dicha estructura se utiliza como mecanismo de documentación del patrón Legacy Wrapper, adaptándolo al contexto de una arquitectura basada en una API REST. 

El patrón se documenta considerando su aplicación en BankPoli, donde la API REST actúa como interfaz para los canales digitales y el Legacy Wrapper encapsula los mecanismos internos requeridos para interactuar con el núcleo transaccional existente. 

#### **5.1. Ícono conceptual del patrón** 

La siguiente representación resume visualmente el principio del patrón: los consumidores interactúan con una interfaz de servicio y esta encapsula el acceso al sistema heredado. 



<!-- Start of picture text -->
Consumidor<br>App Móvil / Portal Web<br>⇓<br>Interfaz REST / JSON<br>⇓<br>LEGACY WRAPPER<br>Encapsulación + transformación<br>⇓<br>Core Bancario Legacy<br><!-- End of picture text -->

Figura 3: Ícono conceptual del patrón Legacy Wrapper 

_Nota._ Elaboración propia a partir del concepto del patrón _Legacy Wrapper_ descrito por Erl (2009). 

14 

Cuadro 2: Documentación del patrón Legacy Wrapper 

|**Elemento**|Descripción|
|---|---|
|**Requerimiento**|¿Cómo exponer las capacidades del núcleo transaccional heredado de BankPoli a<br>nuevos consumidores digitales sin obligarlos a conocer o depender de las tecnolo-<br>gíasyestructuras internas del sistema existente?|
|**Ícono**|Representación conceptual presentada en la Figura 3, donde los consumidores ac-<br>ceden mediante una interfaz de servicio y una capa intermedia encapsula el sistema<br>heredado.|
|**Resumen**|El patrón introduce una capa de servicio que envuelve una capacidad existente del<br>sistema heredadoy proporciona una interfaz uniformepara sus consumidores.|
|**Problema**|BankPoli posee capacidades transaccionales soportadas por un núcleo heredado.<br>Los canales digitales presentan dependencia de mecanismos y estructuras internas,<br>lo que genera acoplamiento, dificulta el mantenimiento y aumenta el esfuerzo nece-<br>sariopara incorporar nuevos consumidores.|
|**Solución**|Implementar una capa_Legacy Wrapper_mediante_LegacyAdapterService_en NestJS.<br>El adaptador recibe solicitudes REST en JSON, valida y transforma la información<br>y posteriormente ejecuta la operación requerida sobre el núcleo transaccional me-<br>diante los mecanismos internos disponibles.|
|**Aplicación**|Se define el endpoint `POST /api/v1/transferencias`. El controlador recibe el<br>DTO,_TransferenciasService_procesa la lógica de negocio y_LegacyAdapterService_<br>transforma los datos para interactuar con el sistema heredado. La respuesta interna<br>se transforma nuevamente a un DTO JSONpara el consumidor.|
|**Impacto**|Entre los beneficios se encuentran la reducción del acoplamiento, reutilización de<br>capacidades existentes, protección del núcleo heredado y posibilidad de moderni-<br>zación progresiva. Como trade-off, la capa intermedia introduce procesamiento adi-<br>cional y requiere mantener los mecanismos de transformación cuando cambien las<br>estructuras internas.|
|**Principios**|Abstracción del servicio, bajo acoplamiento, reutilización, contratos estandarizados<br>yseparación entre interfaz e implementación.|
|**Arquitectura**|Canal digital_→_API Gateway/Controller_→_TransferenciasService_→_LegacyAdap-<br>terService_→_Core bancario heredado.|
|**Relaciones**|El patrón puede complementarse con _Decoupled Contract_, para separar contrato e<br>implementación, y _Service Façade_, para proporcionar una interfaz uniforme a las<br>capacidades internas(Erl,2009).|



### **6. Comunicación entre servicios** 

La comunicación entre los consumidores y los servicios de BankPoli se realizará mediante HTTP sobre TLS, es decir, HTTPS. Los datos se intercambiarán principalmente en formato JSON. Esta decisión permite utilizar mecanismos ampliamente utilizados para la exposición de APIs web y mantener una interfaz independiente de las tecnologías utilizadas por los consumidores. 

#### **6.1. Protocolo y formato** 

La comunicación propuesta utiliza: 

15 

**Transporte:** HTTP/HTTPS. 

**Seguridad de transporte:** TLS. 

**Formato de representación:** JSON. 

**Estilo de interacción:** REST. 

**Autenticación:** JWT mediante encabezado HTTP `Authorization` . 

La comunicación principal será síncrona porque el consumidor requiere una respuesta relacionada con el resultado de la operación solicitada. La arquitectura podría incorporar posteriormente mecanismos asíncronos para procesos como notificaciones, pero estos no forman parte del alcance de esta entrega. 

#### **6.2. Métodos HTTP** 

Los principales endpoints propuestos son: 

Cuadro 3: Endpoints REST propuestos para BankPoli 

|**Método**|Endpoint|Propósito|Respuesta|
|---|---|---|---|
|**POST**|/api/v1/transferencias|Crear y procesar una trans-<br>ferencia interbancaria|201<br>Crea-<br>ted|
|**GET**|/api/v1/transferencias/{id}|Consultar el estado de una<br>transferencia|200 OK|
|**GET**|/api/v1/cuentas/{numero}/saldo|Consultar el saldo disponi-<br>ble de una cuenta|200 OK|
|**POST**|/api/v1/auth/login|Autenticar un usuario y ge-<br>nerar token JWT|200 OK|



#### **6.3. Códigos de respuesta** 

Se utilizarán códigos HTTP para representar los resultados de las operaciones: 

- **200 OK:** operación realizada correctamente. 

- **201 Created:** transferencia creada y registrada correctamente. 

- **400 Bad Request:** datos de entrada inválidos. 

- **401 Unauthorized:** token ausente o inválido. 

- **403 Forbidden:** usuario autenticado sin permisos. 

- **404 Not Found:** recurso inexistente. 

- **500 Internal Server Error:** error interno controlado. 

16 

### **7. Servicio central de orquestación** 

La solución incorpora un punto central de acceso mediante un **API Gateway/Controller desarrollado en NestJS** . Su función principal es recibir las solicitudes externas, aplicar controles transversales y dirigir la petición hacia el servicio correspondiente. 

Para la operación de transferencia, _TransferenciasService_ desempeña la función de orquestador de la lógica de negocio. El flujo general es: 

1. Recepción de la solicitud REST. 

2. Validación del token JWT. 

3. Validación del DTO de entrada. 

4. Verificación de la cuenta de origen. 

5. Verificación de saldo disponible. 

6. Ejecución de la operación mediante el _LegacyAdapterService_ . 

7. Transformación del resultado a un DTO de respuesta. 

8. Retorno de la respuesta HTTP al consumidor. 

El API Gateway evita que los canales digitales deban conocer la localización o implementación de cada componente interno. Al mismo tiempo, _TransferenciasService_ mantiene la coordinación específica de la operación financiera. 

Esta separación permite distinguir entre el componente encargado del acceso y control de las solicitudes y el componente encargado de la orquestación de la operación de negocio. 

### **8. Proveedor y exposición de servicios REST** 

#### **8.1. Proveedor de servicios** 

El proveedor de los servicios REST será la aplicación backend desarrollada con Node.js, TypeScript y NestJS. La aplicación implementará los controladores, servicios, DTO y adaptadores necesarios para exponer mediante HTTP/HTTPS las capacidades requeridas por los canales digitales. 

La estructura lógica de procesamiento será: 

Controller _−→_ Service _−→_ LegacyAdapter _−→_ Core Legacy 

El _Controller_ constituye el punto de entrada de las solicitudes HTTP y se encarga de asociar las rutas de la API con las operaciones correspondientes. Los _DTO_ permiten definir y validar la estructura de los datos intercambiados con los consumidores. 

El _Service_ concentra la lógica de aplicación y coordina las operaciones necesarias para atender cada solicitud. Cuando una operación requiere utilizar capacidades del sistema heredado, el _LegacyAdapter_ realiza la adaptación entre el modelo utilizado por la API y los mecanismos de acceso proporcionados por el núcleo existente. 

17 

Finalmente, el _Core Legacy_ continúa proporcionando las capacidades transaccionales existentes, permaneciendo aislado de los detalles específicos de los consumidores de la API REST. 

Esta estructura permite separar la interfaz REST de la lógica de aplicación y de los mecanismos internos de integración con el sistema heredado, reduciendo la dependencia directa de los consumidores respecto de la implementación del núcleo existente. 

#### **8.2. Catálogo de servicios y especificación OpenAPI 3.x / Swagger UI** 

La especificación y documentación de la API se gestionarán mediante el estándar OpenAPI 3.x, integrado en NestJS mediante la librería `@nestjs/swagger` . 

Es importante precisar la distinción técnica: OpenAPI 3.x constituye la especificación formal del contrato de la API (recursos, operaciones, DTOs y parámetros), mientras que Swagger UI es la interfaz gráfica que permite visualizar e interactuar dinámicamente con dicha especificación en la ruta `/api/docs` . 

El catálogo contendrá: 

Nombre y descripción del servicio. 

Endpoint y método HTTP. 

Parámetros y esquemas JSON DTO. 

Códigos de respuesta HTTP semánticos. 

Requerimientos de autenticación JWT. 

De esta manera, los consumidores dispondrán de un punto común para consultar los contratos disponibles. 

### **9. Seguridad de los servicios** 

Debido a que la solución representa operaciones financieras, la seguridad se incorpora como una preocupación transversal de la arquitectura. 

#### **9.1. Comunicación segura** 

Todas las comunicaciones externas utilizarán HTTPS mediante TLS. Esto permite proteger la información transmitida entre los consumidores y la API frente a interceptación durante el transporte. 

#### **9.2. Autenticación mediante JWT** 

La API utilizará tokens JSON Web Token (JWT) para identificar al usuario autenticado. Las solicitudes protegidas deberán incluir: 

```
Authorization:Bearer<TOKEN_JWT>
```

El token tendrá una duración limitada y contendrá la información necesaria para identificar al usuario y sus permisos. 

18 

#### **9.3. Autorización mediante roles** 

NestJS permitirá implementar _Guards_ para verificar los permisos antes de ejecutar determinadas operaciones. Para el escenario académico se consideran roles como: 

`CLIENTE` . 

`CAJERO` . 

`ADMINISTRADOR` . 

La autorización permite restringir las operaciones de acuerdo con las responsabilidades del usuario. 

#### **9.4. Validación de entradas** 

Los DTO de NestJS se utilizarán para definir y validar la estructura de las solicitudes. Se emplearán mecanismos como `class-validator` y `ValidationPipe` para verificar tipos, formatos, rangos y campos obligatorios. 

La validación se realizará antes de enviar la solicitud al adaptador del sistema heredado. 

#### **9.5. Protección de errores** 

Los errores internos no deberán exponer información como nombres de tablas, consultas SQL, direcciones internas o credenciales. Para ello se implementará un filtro global de excepciones que transforme los errores internos en respuestas HTTP controladas. 

Por ejemplo, ante una falla interna, el consumidor podrá recibir: 

```
{
"statusCode":500,
```

```
"message":"Nofueposibleprocesarlaoperación."
```

```
}
```

sin recibir detalles técnicos internos del núcleo bancario. 

### **10. Plan de implementación técnica** 

La implementación de la solución se realizará utilizando Node.js, TypeScript y NestJS. El desarrollo se plantea para un entorno académico simulado, por lo que no se contempla conexión con un sistema bancario real ni procesamiento de dinero real. 

19 

#### **10.1. Stack tecnológico** 

Cuadro 4: Tecnologías y herramientas previstas 

|**Componente**|Tecnología|
|---|---|
|**Lenguaje**|TypeScript sobre Node.js|
|**Framework backend**|NestJS|
|**Estilo arquitectónico de servicios**|REST|
|**Protocolo**|HTTP/HTTPS|
|**Formato de datos**|JSON|
|**Base de datos**|PostgreSQL|
|**Documentación**|OpenAPI 3.0 / Swagger UI|
|**Autenticación**|JWT|
|**Validación**|class-validator / ValidationPipe|
|**Pruebas unitarias**|Jest|
|**Pruebas de API**|Postman|
|**Control de versiones**|GityGitHub|



#### **10.2. Estructura propuesta del proyecto** 

La estructura inicial del proyecto será: 

```
src/
|
```

```
+--main.ts
+--app.module.ts
|
```

```
+--auth/
```

- `| +-- auth.controller.ts` 

- `| +-- auth.service.ts` 

- `| +-- guards/` 

- `| | +-- jwt-auth.guard.ts` 

- `| +-- dto/ | +-- login.dto.ts` 

- `|` 

```
+--cuentas/
```

- `| +-- cuentas.controller.ts` 

- `| +-- cuentas.service.ts` 

- `| +-- dto/ | +-- consulta-saldo.dto.ts` 

- `|` 

```
+--transferencias/
```

- `| +-- transferencias.controller.ts` 

- `| +-- transferencias.service.ts` 

- `| +-- legacy-adapter.service.ts` 

- `| +-- dto/` 

20 

- `| | +-- crear-transferencia.dto.ts` 

- `| | +-- respuesta-transferencia.dto.ts` 

- `| +-- entities/` 

- `| +-- transferencia.entity.ts` 

- `|` 

```
+--common/
```

- `+-- filters/` 

```
+--http-exception.filter.ts
```

Esta estructura separa las responsabilidades de autenticación, cuentas, transferencias y componentes comunes, mientras que `legacy-adapter.service.ts` concentra la comunicación con el núcleo heredado. 

#### **10.3. Endpoints previstos** 

Los endpoints principales para la implementación son: 

Cuadro 5: Especificación preliminar de endpoints 

|**Método**|Endpoint|Descripción|
|---|---|---|
|**POST**|/api/v1/auth/login|Autenticación y generación de to-<br>ken JWT.|
|**POST**|/api/v1/transferencias|Creación y procesamiento de una<br>transferencia.|
|**GET**|/api/v1/transferencias/{id}|Consulta del estado de una transfe-<br>rencia.|
|**GET**|/api/v1/cuentas/{numero}/saldo|Consulta del saldo de una cuenta.|



#### **10.4. Plan de desarrollo** 

La implementación se organizará en las siguientes etapas: 

1. **Configuración del proyecto:** creación del proyecto NestJS, configuración de TypeScript y definición de módulos. 

2. **Modelo de datos:** creación de la base de datos PostgreSQL para representar el escenario transaccional académico. 

3. **Servicios de autenticación:** implementación de login, generación de JWT y validación de solicitudes. 

4. **Servicio de cuentas:** implementación de consulta de cuentas y saldo disponible. 

5. **Servicio de transferencias:** implementación de la lógica principal de transferencia. 

6. **Legacy Wrapper:** desarrollo de `LegacyAdapterService` para encapsular la interacción con el componente que representa el sistema heredado. 

7. **Documentación:** configuración de OpenAPI y Swagger UI. 

21 

8. **Pruebas:** ejecución de pruebas unitarias mediante Jest y pruebas de integración de los endpoints mediante Postman. 

9. **Validación arquitectónica:** comparación entre la integración inicial y la solución propuesta para identificar cambios en interoperabilidad, acoplamiento y reutilización. 

### **11. Consistencia y trazabilidad de la solución** 

La solución propuesta mantiene una relación directa con la problemática definida en la primera entrega. La trazabilidad puede resumirse de la siguiente manera: 

Cuadro 6: Trazabilidad entre problemática y solución 

|**Problema identificado**|Decisión arquitectónica|Respuestapropuesta|
|---|---|---|
|**Acoplamiento punto a**<br>**punto**|Servicios REST con contratos definidos|Interfaces uniformes pa-<br>ra los consumidores|
|**Dependencia del Core**<br>**Legacy**|Patrón Legacy Wrapper|Encapsulación de la im-<br>plementación heredada|
|**Exposición de detalles**<br>**internos**|LegacyAdapterService|Separación entre contra-<br>to externo e implementa-<br>ción interna|
|**Dificultad para descu-**<br>**brir servicios**|OpenAPI / Swagger UI|Catálogo de endpoints y<br>contratos|
|**Integraciones**<br>**hetero-**<br>**géneas**|HTTP/HTTPS + JSON|Formato de intercambio<br>uniforme|
|**Riesgo de acceso no**<br>**controlado**|JWT + Guards + roles|Autenticación y autori-<br>zación|
|**Dificultad para incor-**<br>**porar consumidores**|Servicios reutilizables|Misma capacidad dispo-<br>niblepara App yWeb|



La trazabilidad evidencia que las decisiones de la segunda entrega no son independientes del problema original. El modelo REST, el patrón _Legacy Wrapper_ , el API Gateway, los servicios de negocio, el catálogo y los mecanismos de seguridad responden a las causas identificadas en la primera entrega. 

Asimismo, la solución prepara la tercera entrega, en la cual se podrá implementar el servicio REST y demostrar mediante pruebas la transformación entre la arquitectura inicial y la arquitectura propuesta. 

### **12. Cierre de la segunda entrega** 

El análisis realizado permitió pasar de la identificación general de la problemática de interoperabilidad y acoplamiento a una propuesta arquitectónica concreta para el escenario BankPoli. Se identificaron los servicios involucrados, el proveedor, el mecanismo de catálogo, las interfaces, la comunicación, el componente central de orquestación y los mecanismos de seguridad. 

A partir de este análisis se seleccionó el patrón _Legacy Wrapper_ como elemento principal de la solución, debido a que permite encapsular las capacidades del núcleo transaccional heredado 

22 

y proporcionar una interfaz de servicio independiente de sus detalles internos. La propuesta se complementa con contratos desacoplados y una fachada de acceso. 

También se estableció REST como el estilo de exposición de los servicios y Node.js con NestJS como tecnología para la implementación. Los diagramas presentados muestran la estructura lógica de la solución y el flujo de una transferencia interbancaria, manteniendo correspondencia con los componentes descritos. 

De esta manera, la segunda entrega establece la base conceptual y técnica para la tercera etapa del proyecto, en la cual se podrá implementar, probar y evaluar el servicio REST dentro del entorno académico simulado. 

23 

### **Referencias** 

- Bank for International Settlements. (2020, diciembre). _Enabling open finance through APIs_ (inf. téc.). Bank for International Settlements. https://www.bis.org/publ/othp36.htm 

- Bank for International Settlements. (2026). _Project Aperta_ (inf. téc.). BIS Innovation Hub. https: //www.bis.org/about/bisih/topics/fmis/aperta.htm 

- Bass, L., Clements, P. C., & Kazman, R. (2012). _Software Architecture in Practice_ (3.<sup>a</sup> ed.). Addison-Wesley Professional. 

- Boar, C., Claessens, S., Kosse, A., Leckow, R., & Rice, T. (2021). Interoperability between payment systems across borders. _BIS Bulletin_ , (49). https://www.bis.org/publications/bulletin49-interoperability-between-payment-systems-across-borders 

- Erl, T. (2009). _SOA Design Patterns_ . Prentice Hall. 

- Richardson, L., & Ruby, S. (2007). _RESTful Web Services_ . O’Reilly Media. 

24 

