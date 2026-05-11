import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, Footer, Header, LevelFormat, PageBreak, VerticalAlign,
  TabStopType, TabStopPosition
} from "/opt/homebrew/lib/node_modules/docx/dist/index.mjs";
import fs from "fs";

// ── helpers ──────────────────────────────────────────────────────────────────
const TNR = "Times New Roman";
const COURIER = "Courier New";
const PT14 = 28;   // half-points
const PT12 = 24;
const PT11 = 22;

// Page: A4, margins left 3cm right 1.5cm top 2cm bottom 2cm  (1cm ≈ 567 DXA)
const LEFT   = 1701;  // 3cm
const RIGHT  =  851;  // 1.5cm
const TOP    = 1134;  // 2cm
const BOTTOM = 1134;  // 2cm
const PAGE_W = 11906; // A4
const CONTENT_W = PAGE_W - LEFT - RIGHT; // ≈ 9354

const spacing = { line: 360, lineRule: "auto" }; // 1.5 line spacing

function h(text, lvl = 0) {
  // Section heading: bold, centered, caps, TNR 14
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    pageBreakBefore: lvl === 0,
    spacing: { before: 240, after: 240, ...spacing },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: PT14, font: TNR })]
  });
}

function h2(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 120, ...spacing },
    children: [new TextRun({ text, bold: true, size: PT14, font: TNR })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 120, ...spacing },
    indent: opts.noIndent ? undefined : { firstLine: 720 },
    children: [new TextRun({ text, size: PT14, font: TNR, ...opts })]
  });
}

function empty() {
  return new Paragraph({ spacing: { ...spacing }, children: [new TextRun("")] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function bullet(items) {
  return items.map(text =>
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 60, after: 60, ...spacing },
      indent: { left: 720, hanging: 360 },
      children: [new TextRun({ text: `— ${text}`, size: PT14, font: TNR })]
    })
  );
}

function numbered(items) {
  return items.map((text, i) =>
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 60, after: 60, ...spacing },
      indent: { left: 720, hanging: 360 },
      children: [new TextRun({ text: `${i + 1}. ${text}`, size: PT14, font: TNR })]
    })
  );
}

function code(lines) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: border, bottom: border, left: border, right: border },
            shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 160, right: 160 },
            width: { size: CONTENT_W, type: WidthType.DXA },
            children: lines.map(line =>
              new Paragraph({
                spacing: { line: 240, lineRule: "auto" },
                children: [new TextRun({ text: line, size: PT11, font: COURIER })]
              })
            )
          })
        ]
      })
    ]
  });
}

function screenshotPlaceholder(num, caption) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" };
  return [
    new Table({
      width: { size: CONTENT_W * 0.6, type: WidthType.DXA },
      columnWidths: [Math.round(CONTENT_W * 0.6)],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: { top: border, bottom: border, left: border, right: border },
              shading: { fill: "EEEEEE", type: ShadingType.CLEAR },
              margins: { top: 800, bottom: 800, left: 200, right: 200 },
              width: { size: Math.round(CONTENT_W * 0.6), type: WidthType.DXA },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `[ Вставити скріншот ${num} ]`, size: PT12, font: TNR, color: "888888" })]
                })
              ]
            })
          ]
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 200, ...spacing },
      children: [new TextRun({ text: caption, size: PT12, font: TNR, italics: true })]
    })
  ];
}

function dataTable(headers, rows) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const colW = Math.floor(CONTENT_W / headers.length);
  const colWidths = headers.map(() => colW);

  const makeRow = (cells, isHeader = false) =>
    new TableRow({
      children: cells.map((text, i) =>
        new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: isHeader ? { fill: "D9D9D9", type: ShadingType.CLEAR } : undefined,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 280, lineRule: "auto" },
            children: [new TextRun({ text, size: PT12, font: TNR, bold: isHeader })]
          })]
        })
      )
    });

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [makeRow(headers, true), ...rows.map(r => makeRow(r))]
  });
}

// ── TOC line helper ───────────────────────────────────────────────────────────
function tocLine(label, page) {
  return new Paragraph({
    spacing: { before: 60, after: 60, ...spacing },
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W, leader: "dot" }],
    children: [
      new TextRun({ text: label, size: PT14, font: TNR }),
      new TextRun({ text: `\t${page}`, size: PT14, font: TNR })
    ]
  });
}

// ── DOCUMENT ─────────────────────────────────────────────────────────────────
const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: 16838 },
          margin: { top: TOP, right: RIGHT, bottom: BOTTOM, left: LEFT }
        }
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], size: PT14, font: TNR })]
            })
          ]
        })
      },
      children: [
        // ── ТИТУЛЬНА СТОРІНКА ──────────────────────────────────────────────
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120, line: 360, lineRule: "auto" }, children: [new TextRun({ text: "[НАЗВА УНІВЕРСИТЕТУ]", bold: true, size: PT14, font: TNR })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 400, line: 360, lineRule: "auto" }, children: [new TextRun({ text: "[ФАКУЛЬТЕТ / КАФЕДРА]", size: PT14, font: TNR })] }),

        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2000, after: 120, line: 360, lineRule: "auto" }, children: [new TextRun({ text: "ПОЯСНЮВАЛЬНА ЗАПИСКА", bold: true, size: PT14, font: TNR })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120, line: 360, lineRule: "auto" }, children: [new TextRun({ text: "до міні-проєкту", size: PT14, font: TNR })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120, line: 360, lineRule: "auto" }, children: [new TextRun({ text: "з дисципліни «Розробка мобільних застосувань»", size: PT14, font: TNR })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120, line: 360, lineRule: "auto" }, children: [new TextRun({ text: "на тему:", size: PT14, font: TNR })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 2000, line: 360, lineRule: "auto" }, children: [new TextRun({ text: "«Додаток для планування подорожей TripPlanner»", bold: true, size: PT14, font: TNR })] }),

        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 120, line: 360, lineRule: "auto" }, children: [new TextRun({ text: "Виконав(ла): [ПІБ студента]", size: PT14, font: TNR })] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 120, line: 360, lineRule: "auto" }, children: [new TextRun({ text: "Група: [ГРУПА]", size: PT14, font: TNR })] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 2000, line: 360, lineRule: "auto" }, children: [new TextRun({ text: "Перевірив(ла): [ПІБ викладача]", size: PT14, font: TNR })] }),

        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0, line: 360, lineRule: "auto" }, children: [new TextRun({ text: "2026", size: PT14, font: TNR })] }),

        // ── ЗМІСТ ─────────────────────────────────────────────────────────
        pageBreak(),
        h("ЗМІСТ", 1),
        tocLine("ВСТУП", "3"),
        tocLine("1. ПОСТАНОВКА ЗАДАЧІ", "4"),
        tocLine("   1.1. Функціональні вимоги", "4"),
        tocLine("   1.2. Нефункціональні вимоги", "5"),
        tocLine("   1.3. Архітектурні вимоги", "5"),
        tocLine("2. ПРОЄКТУВАННЯ", "6"),
        tocLine("   2.1. Діаграма варіантів використання", "6"),
        tocLine("   2.2. Діаграма класів", "7"),
        tocLine("   2.3. ER-діаграма бази даних", "8"),
        tocLine("   2.4. Навігаційна структура", "8"),
        tocLine("3. ОПИС РЕАЛІЗАЦІЇ", "9"),
        tocLine("   3.1. Технологічний стек", "9"),
        tocLine("   3.2. Модель даних", "10"),
        tocLine("   3.3. Інтерфейс доступу до даних (DAO)", "10"),
        tocLine("   3.4. База даних та репозиторій", "11"),
        tocLine("   3.5. ViewModel", "12"),
        tocLine("   3.6. Головний екран (MainActivity)", "13"),
        tocLine("   3.7. Екран статистики (StatisticsActivity)", "13"),
        tocLine("4. ТЕСТУВАННЯ", "14"),
        tocLine("   4.1. Опис тестування", "14"),
        tocLine("   4.2. Тест-кейси", "14"),
        tocLine("   4.3. Скріншоти роботи додатку", "16"),
        tocLine("ВИСНОВКИ", "17"),
        tocLine("СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ", "18"),
        tocLine("ДОДАТКИ", "19"),

        // ── ВСТУП ─────────────────────────────────────────────────────────
        h("ВСТУП"),
        p("Мобільні застосунки для планування подорожей є одним із найбільш затребуваних класів програмного забезпечення у сучасному світі. З розвитком смартфонів та доступністю мобільного інтернету мільйони людей щодня використовують мобільні додатки для організації своїх поїздок, відстеження витрат та зберігання інформації про маршрути."),
        p("Мета роботи — розробка повноцінного Android-додатку «TripPlanner» для планування подорожей з використанням технологій, вивчених під час практичних робіт з дисципліни «Розробка мобільних застосувань»."),
        p("Актуальність теми обумовлена зростаючою потребою у зручних інструментах для організації подорожей, відстеження бюджету та зберігання деталей поїздок в єдиному місці. Більшість існуючих рішень є або надмірно складними, або вимагають постійного підключення до мережі."),
        h2("Огляд аналогів"),
        p("Серед існуючих аналогів можна виділити наступні застосунки:", { noIndent: true }),
        ...bullet([
          "TripIt — комплексний планувальник подорожей з синхронізацією електронної пошти та хмарним зберіганням даних. Недоліком є складність інтерфейсу та обов'язкова реєстрація.",
          "Google Trips (припинено) — додаток від Google для організації поїздок з автоматичним збором бронювань із Gmail. Був припинений у 2019 році.",
          "Polarsteps — акцент на відстеженні маршрутів через GPS та створенні фотощоденника подорожі. Потребує постійного доступу до мережі.",
          "TripPlanner (розроблений у даній роботі) — легкий локальний застосунок без необхідності реєстрації, з простим інтерфейсом та повним збереженням даних на пристрої.",
        ]),

        // ── РОЗДІЛ 1 ──────────────────────────────────────────────────────
        h("1. ПОСТАНОВКА ЗАДАЧІ"),
        h2("1.1. Функціональні вимоги"),
        p("Додаток «TripPlanner» повинен забезпечувати виконання наступних функціональних вимог:", { noIndent: true }),
        ...numbered([
          "Відображення списку всіх запланованих поїздок у вигляді карток із назвою, місцем призначення, датами та бюджетом.",
          "Додавання нової поїздки з вказанням назви, місця призначення, дати початку та закінчення, бюджету та нотаток.",
          "Перегляд детальної інформації про поїздку на окремому екрані.",
          "Редагування існуючої поїздки зі збереженням усіх змін.",
          "Видалення поїздки з підтвердженням через діалогове вікно.",
          "Перегляд статистики: загальна кількість поїздок, сумарний бюджет, середній бюджет, найдорожча та остання поїздка.",
          "Навігація між екранами через бічне меню (Navigation Drawer).",
          "Відображення порожнього стану при відсутності поїздок.",
        ]),
        h2("1.2. Нефункціональні вимоги"),
        ...numbered([
          "Зберігання даних локально на пристрої без потреби в мережевому з'єднанні.",
          "Підтримка портретної та ландшафтної орієнтації екрану.",
          "Відповідність принципам Material Design.",
          "Мінімальна версія Android: API 24 (Android 7.0 Nougat).",
          "Коректна валідація вхідних даних із повідомленням про помилки.",
        ]),
        h2("1.3. Архітектурні вимоги"),
        p("Додаток розробляється з дотриманням архітектурного паттерну MVVM (Model-View-ViewModel), що забезпечує чітке розділення відповідальностей між компонентами:"),
        ...bullet([
          "Model — сутності бази даних (Room/SQLite) та репозиторій для доступу до даних;",
          "View — Activity та XML-макети, що відображають дані та реагують на дії користувача;",
          "ViewModel — посередник між View та Model, зберігає стан UI та надає дані через LiveData.",
        ]),

        // ── РОЗДІЛ 2 ──────────────────────────────────────────────────────
        h("2. ПРОЄКТУВАННЯ"),
        h2("2.1. Діаграма варіантів використання (Use Case)"),
        p("Діаграма варіантів використання відображає взаємодію актора (користувача) з функціями системи. Актором виступає кінцевий користувач додатку, який може виконувати такі дії:"),
        ...bullet([
          "Переглянути список поїздок",
          "Додати нову поїздку",
          "Редагувати існуючу поїздку",
          "Видалити поїздку",
          "Переглянути деталі поїздки",
          "Переглянути статистику",
          "Навігувати між екранами через меню",
        ]),
        p("Між варіантами використання «Редагувати поїздку» та «Додати поїздку» існує відношення include — обидва відкривають один і той же екран форми (AddTripActivity)."),

        h2("2.2. Діаграма класів"),
        p("Проєкт організований у наступні пакети:", { noIndent: true }),
        ...bullet([
          "com.example.tripplanner — основні Activity (MainActivity, AddTripActivity, TripDetailActivity, StatisticsActivity);",
          "com.example.tripplanner.data — шар даних: Trip (сутність), TripDao (інтерфейс доступу), TripDatabase (база даних), TripRepository (репозиторій);",
          "com.example.tripplanner.adapter — TripAdapter для RecyclerView.",
        ]),
        p("Основні класи та їх зв'язки:", { noIndent: true }),
        ...bullet([
          "Trip — data class, представляє сутність поїздки в базі даних. Поля: id, title, destination, startDate, endDate, budget, notes, imageUri.",
          "TripDao — інтерфейс з анотаціями Room (@Query, @Insert, @Update, @Delete) для виконання CRUD-операцій.",
          "TripDatabase — абстрактний клас, реалізує RoomDatabase. Singleton-патерн для єдиного екземпляру бази даних.",
          "TripRepository — клас-посередник між ViewModel та DAO, інкапсулює логіку доступу до даних.",
          "TripViewModel — наслідує AndroidViewModel, надає LiveData<List<Trip>> для спостереження в Activity.",
        ]),

        h2("2.3. ER-діаграма бази даних"),
        p("База даних містить одну таблицю trips з наступною структурою:", { noIndent: true }),
        empty(),
        dataTable(
          ["Поле", "Тип", "Обмеження", "Опис"],
          [
            ["id", "INTEGER", "PK, AUTOINCREMENT", "Унікальний ідентифікатор"],
            ["title", "TEXT", "NOT NULL", "Назва поїздки"],
            ["destination", "TEXT", "NOT NULL", "Місце призначення"],
            ["startDate", "TEXT", "NOT NULL", "Дата початку"],
            ["endDate", "TEXT", "NOT NULL", "Дата закінчення"],
            ["budget", "REAL", "NOT NULL", "Бюджет у доларах"],
            ["notes", "TEXT", "—", "Нотатки (опціонально)"],
            ["imageUri", "TEXT", "DEFAULT ''", "URI фото (резерв)"],
          ]
        ),
        empty(),

        h2("2.4. Навігаційна структура додатку"),
        p("Додаток містить чотири екрани з наступною навігацією:", { noIndent: true }),
        ...bullet([
          "MainActivity (головний екран) → AddTripActivity через FAB або пункт drawer меню;",
          "MainActivity → TripDetailActivity при натисканні на картку поїздки;",
          "MainActivity → StatisticsActivity через пункт «Статистика» в drawer меню;",
          "TripDetailActivity → AddTripActivity при натисканні кнопки «Редагувати»;",
          "AddTripActivity, TripDetailActivity, StatisticsActivity → повернення до MainActivity через кнопку «Назад» на Toolbar.",
        ]),

        // ── РОЗДІЛ 3 ──────────────────────────────────────────────────────
        h("3. ОПИС РЕАЛІЗАЦІЇ"),
        h2("3.1. Технологічний стек"),
        empty(),
        dataTable(
          ["Технологія", "Версія", "Призначення"],
          [
            ["Kotlin", "2.2.10", "Основна мова програмування"],
            ["Android SDK", "API 34", "Платформа розробки"],
            ["Room Database", "2.7.1", "ORM для SQLite"],
            ["ViewModel + LiveData", "2.8.3", "Архітектурні компоненти MVVM"],
            ["Kotlin Coroutines", "1.8.1", "Асинхронні операції з БД"],
            ["Material Components", "1.12.0", "UI компоненти Material Design"],
            ["RecyclerView", "1.3.2", "Список поїздок"],
            ["Navigation Component", "2.7.7", "Навігація між екранами"],
          ]
        ),
        empty(),

        h2("3.2. Модель даних"),
        p("Сутність Trip визначена як data class з анотаціями Room:"),
        empty(),
        code([
          "@Entity(tableName = \"trips\")",
          "data class Trip(",
          "    @PrimaryKey(autoGenerate = true)",
          "    val id: Int = 0,",
          "    val title: String,",
          "    val destination: String,",
          "    val startDate: String,",
          "    val endDate: String,",
          "    val budget: Double,",
          "    val notes: String,",
          "    val imageUri: String = \"\"",
          ")",
        ]),
        empty(),
        p("Анотація @Entity вказує Room, що даний клас є таблицею бази даних. @PrimaryKey(autoGenerate = true) забезпечує автоматичне призначення ідентифікаторів новим записам."),

        h2("3.3. Інтерфейс доступу до даних (DAO)"),
        p("TripDao визначає всі операції з базою даних за допомогою анотацій Room:"),
        empty(),
        code([
          "@Dao",
          "interface TripDao {",
          "    @Query(\"SELECT * FROM trips ORDER BY id DESC\")",
          "    fun getAllTrips(): LiveData<List<Trip>>",
          "",
          "    @Query(\"SELECT * FROM trips WHERE id = :id\")",
          "    fun getTripById(id: Int): LiveData<Trip>",
          "",
          "    @Insert(onConflict = OnConflictStrategy.REPLACE)",
          "    suspend fun insertTrip(trip: Trip)",
          "",
          "    @Update",
          "    suspend fun updateTrip(trip: Trip)",
          "",
          "    @Delete",
          "    suspend fun deleteTrip(trip: Trip)",
          "}",
        ]),
        empty(),
        p("Методи getAllTrips() та getTripById() повертають LiveData, що дозволяє UI автоматично оновлюватись при зміні даних. Операції запису (insert, update, delete) є suspend-функціями для виконання в корутинах без блокування головного потоку."),

        h2("3.4. База даних та репозиторій"),
        p("TripDatabase реалізує клас RoomDatabase та забезпечує доступ до DAO:"),
        empty(),
        code([
          "@Database(entities = [Trip::class], version = 1, exportSchema = false)",
          "abstract class TripDatabase : RoomDatabase() {",
          "    abstract fun tripDao(): TripDao",
          "",
          "    companion object {",
          "        @Volatile private var INSTANCE: TripDatabase? = null",
          "",
          "        fun getDatabase(context: Context): TripDatabase {",
          "            return INSTANCE ?: synchronized(this) {",
          "                Room.databaseBuilder(",
          "                    context.applicationContext,",
          "                    TripDatabase::class.java,",
          "                    \"trip_database\"",
          "                ).build().also { INSTANCE = it }",
          "            }",
          "        }",
          "    }",
          "}",
        ]),
        empty(),
        p("Використовується патерн Singleton для забезпечення єдиного екземпляру бази даних. Анотація @Volatile гарантує видимість змін між потоками."),

        h2("3.5. ViewModel"),
        p("TripViewModel є посередником між UI та шаром даних:"),
        empty(),
        code([
          "class TripViewModel(application: Application) : AndroidViewModel(application) {",
          "    private val repository: TripRepository",
          "    val allTrips: LiveData<List<Trip>>",
          "",
          "    init {",
          "        val dao = TripDatabase.getDatabase(application).tripDao()",
          "        repository = TripRepository(dao)",
          "        allTrips = repository.allTrips",
          "    }",
          "",
          "    fun insertTrip(trip: Trip) = viewModelScope.launch {",
          "        repository.insertTrip(trip)",
          "    }",
          "    fun updateTrip(trip: Trip) = viewModelScope.launch {",
          "        repository.updateTrip(trip)",
          "    }",
          "    fun deleteTrip(trip: Trip) = viewModelScope.launch {",
          "        repository.deleteTrip(trip)",
          "    }",
          "}",
        ]),
        empty(),
        p("TripViewModel наслідує AndroidViewModel для доступу до Application context. viewModelScope автоматично скасовує корутини при знищенні ViewModel, запобігаючи витокам пам'яті."),

        h2("3.6. Головний екран (MainActivity)"),
        p("MainActivity відображає список поїздок через RecyclerView. При порожньому списку відображається стан-заглушка з іконкою літака:"),
        empty(),
        code([
          "viewModel.allTrips.observe(this) { trips ->",
          "    adapter.updateTrips(trips)",
          "    if (trips.isEmpty()) {",
          "        recyclerView.visibility = View.GONE",
          "        emptyState.visibility = View.VISIBLE",
          "    } else {",
          "        recyclerView.visibility = View.VISIBLE",
          "        emptyState.visibility = View.GONE",
          "    }",
          "}",
        ]),
        empty(),
        p("Navigation Drawer реалізований через DrawerLayout та ActionBarDrawerToggle. Меню містить три пункти: «Мої поїздки», «Додати поїздку» та «Статистика»."),

        h2("3.7. Екран статистики (StatisticsActivity)"),
        p("StatisticsActivity обчислює та відображає агреговані дані по всіх поїздках:"),
        empty(),
        code([
          "viewModel.allTrips.observe(this) { trips ->",
          "    val totalBudget = trips.sumOf { it.budget }",
          "    val avgBudget = if (trips.isNotEmpty()) totalBudget / trips.size else 0.0",
          "    val mostExpensive = trips.maxByOrNull { it.budget }",
          "",
          "    tvTotalTrips.text = trips.size.toString()",
          "    tvTotalBudget.text = \"$%.2f\".format(totalBudget)",
          "    tvAvgBudget.text = \"$%.2f\".format(avgBudget)",
          "    tvMostExpensive.text = mostExpensive?.let {",
          "        \"${it.title} — ${it.destination} ($%.2f)\".format(it.budget)",
          "    } ?: getString(R.string.no_data)",
          "}",
        ]),
        empty(),

        // ── РОЗДІЛ 4 ──────────────────────────────────────────────────────
        h("4. ТЕСТУВАННЯ"),
        h2("4.1. Опис тестування"),
        p("Тестування додатку проводилось на емуляторі Android (API 34, Pixel 6) у середовищі Android Studio Meerkat. Перевірялась коректність роботи всіх заявлених функцій, валідація вводу, навігація між екранами та відображення даних в обох орієнтаціях."),

        h2("4.2. Тест-кейси"),
        empty(),
        dataTable(
          ["№", "Назва тест-кейсу", "Очікуваний результат", "Статус"],
          [
            ["TC-01", "Порожній стан", "Іконка літака та текст «Поїздок ще немає»", "Пройдено"],
            ["TC-02", "Додавання поїздки", "Поїздка з'являється у списку", "Пройдено"],
            ["TC-03", "Валідація порожніх полів", "Toast з повідомленням про помилку", "Пройдено"],
            ["TC-04", "Перегляд деталей", "Відкривається екран з деталями", "Пройдено"],
            ["TC-05", "Редагування поїздки", "Дані оновлюються у списку", "Пройдено"],
            ["TC-06", "Видалення поїздки", "Поїздка зникає зі списку", "Пройдено"],
            ["TC-07", "Скасування видалення", "Поїздка залишається у списку", "Пройдено"],
            ["TC-08", "Навігація через Drawer", "Відкривається екран статистики", "Пройдено"],
            ["TC-09", "Статистика", "Коректно відображаються показники", "Пройдено"],
            ["TC-10", "Ландшафтна орієнтація", "UI адаптується, дані зберігаються", "Пройдено"],
          ]
        ),
        empty(),

        h2("4.3. Скріншоти роботи додатку"),
        p("Рисунок 4.1 — Головний екран (порожній стан)", { noIndent: true, center: true }),
        ...screenshotPlaceholder("4.1", "Рисунок 4.1 — Головний екран (порожній стан)"),
        empty(),
        p("Рисунок 4.2 — Головний екран зі списком поїздок", { noIndent: true, center: true }),
        ...screenshotPlaceholder("4.2", "Рисунок 4.2 — Головний екран зі списком поїздок"),
        empty(),
        p("Рисунок 4.3 — Екран додавання нової поїздки", { noIndent: true, center: true }),
        ...screenshotPlaceholder("4.3", "Рисунок 4.3 — Екран додавання нової поїздки"),
        empty(),
        p("Рисунок 4.4 — Екран деталей поїздки", { noIndent: true, center: true }),
        ...screenshotPlaceholder("4.4", "Рисунок 4.4 — Екран деталей поїздки"),
        empty(),
        p("Рисунок 4.5 — Екран статистики", { noIndent: true, center: true }),
        ...screenshotPlaceholder("4.5", "Рисунок 4.5 — Екран статистики"),
        empty(),
        p("Рисунок 4.6 — Ландшафтна орієнтація", { noIndent: true, center: true }),
        ...screenshotPlaceholder("4.6", "Рисунок 4.6 — Ландшафтна орієнтація"),

        // ── ВИСНОВКИ ──────────────────────────────────────────────────────
        h("ВИСНОВКИ"),
        p("У ході виконання міні-проєкту було розроблено повноцінний Android-додаток «TripPlanner» для планування подорожей. Додаток реалізує всі обов'язкові компоненти відповідно до вимог завдання."),
        p("В процесі розробки були використані наступні технології та підходи:", { noIndent: true }),
        ...bullet([
          "архітектурний паттерн MVVM з використанням ViewModel та LiveData для реактивного оновлення інтерфейсу;",
          "Room Database (ORM над SQLite) для локального зберігання даних з повною підтримкою CRUD-операцій;",
          "Kotlin Coroutines для асинхронного виконання операцій з базою даних без блокування головного потоку;",
          "Material Design Components для побудови сучасного та зручного користувацького інтерфейсу;",
          "Navigation Drawer для навігації між чотирма екранами застосунку;",
          "адаптивний інтерфейс з підтримкою портретної та ландшафтної орієнтації через layout-land ресурси.",
        ]),
        p("Додаток успішно пройшов тестування на емуляторі Android API 34. Всі 10 заявлених тест-кейсів виконані успішно: додавання, перегляд, редагування та видалення поїздок, перегляд статистики, валідація вхідних даних та навігація між екранами."),
        p("Отримані практичні навички розробки Android-застосунків з використанням сучасного технологічного стеку Kotlin + Room + MVVM є актуальними та затребуваними в індустрії мобільної розробки."),

        // ── СПИСОК ДЖЕРЕЛ ─────────────────────────────────────────────────
        h("СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ"),
        ...numbered([
          "Android Developers. Room Persistence Library. — Режим доступу: https://developer.android.com/training/data-storage/room",
          "Android Developers. Guide to App Architecture (MVVM). — Режим доступу: https://developer.android.com/topic/architecture",
          "Android Developers. Material Design Components for Android. — Режим доступу: https://m2.material.io/develop/android",
          "Kotlin Documentation. Coroutines Guide. — Режим доступу: https://kotlinlang.org/docs/coroutines-guide.html",
          "Android Developers. ViewModel Overview. — Режим доступу: https://developer.android.com/topic/libraries/architecture/viewmodel",
          "Android Developers. LiveData Overview. — Режим доступу: https://developer.android.com/topic/libraries/architecture/livedata",
          "Android Developers. Navigation Component. — Режим доступу: https://developer.android.com/guide/navigation",
        ]),

        // ── ДОДАТКИ ───────────────────────────────────────────────────────
        h("ДОДАТКИ"),
        h2("Додаток А. Структура проєкту"),
        empty(),
        code([
          "com.example.tripplanner/",
          "├── MainActivity.kt",
          "├── AddTripActivity.kt",
          "├── TripDetailActivity.kt",
          "├── StatisticsActivity.kt",
          "├── TripViewModel.kt",
          "├── adapter/",
          "│   └── TripAdapter.kt",
          "└── data/",
          "    ├── Trip.kt",
          "    ├── TripDao.kt",
          "    ├── TripDatabase.kt",
          "    └── TripRepository.kt",
          "",
          "res/",
          "├── layout/          (портретні макети)",
          "├── layout-land/     (ландшафтні макети)",
          "├── menu/",
          "└── values/",
          "    ├── colors.xml",
          "    ├── strings.xml",
          "    └── themes.xml",
        ]),
        empty(),

        h2("Додаток Б. Повний код TripAdapter.kt"),
        empty(),
        code([
          "class TripAdapter(",
          "    private var trips: List<Trip> = emptyList(),",
          "    private val onItemClick: (Trip) -> Unit",
          ") : RecyclerView.Adapter<TripAdapter.TripViewHolder>() {",
          "",
          "    inner class TripViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {",
          "        val tvTitle: TextView = itemView.findViewById(R.id.tvTitle)",
          "        val tvDestination: TextView = itemView.findViewById(R.id.tvDestination)",
          "        val tvDates: TextView = itemView.findViewById(R.id.tvDates)",
          "        val tvBudget: TextView = itemView.findViewById(R.id.tvBudget)",
          "    }",
          "",
          "    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TripViewHolder {",
          "        val view = LayoutInflater.from(parent.context)",
          "            .inflate(R.layout.item_trip, parent, false)",
          "        return TripViewHolder(view)",
          "    }",
          "",
          "    override fun onBindViewHolder(holder: TripViewHolder, position: Int) {",
          "        val trip = trips[position]",
          "        holder.tvTitle.text = trip.title",
          "        holder.tvDestination.text = trip.destination",
          "        holder.tvDates.text = \"${trip.startDate} - ${trip.endDate}\"",
          "        holder.tvBudget.text = \"$${trip.budget}\"",
          "        holder.itemView.setOnClickListener { onItemClick(trip) }",
          "    }",
          "",
          "    override fun getItemCount() = trips.size",
          "",
          "    fun updateTrips(newTrips: List<Trip>) {",
          "        trips = newTrips",
          "        notifyDataSetChanged()",
          "    }",
          "}",
        ]),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/sofiagunkalo/Desktop/TripPlanner/Звіт_TripPlanner.docx", buffer);
  console.log("Done!");
});
