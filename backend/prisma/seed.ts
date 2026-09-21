import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

type PolicySeed = {
  name: string;
  description: string;
  sourceUrl: string;
};

const POLICY_VERSION = "catalog-2026-09";

const policyCatalog: Record<string, PolicySeed[]> = {
  INSTAGRAM: [
    {
      name: "Pelecehan & Perundungan",
      description: "Konten atau perilaku yang menargetkan orang untuk merendahkan, mempermalukan, mengganggu, atau melecehkan.",
      sourceUrl: "https://www.facebook.com/help/instagram/477434105621119",
    },
    {
      name: "Ujaran Kebencian",
      description: "Serangan atau ujaran kebencian terhadap orang atau kelompok berdasarkan karakteristik yang dilindungi.",
      sourceUrl: "https://www.facebook.com/help/instagram/477434105621119",
    },
    {
      name: "Ancaman & Kekerasan",
      description: "Ancaman kredibel, ajakan kekerasan, atau konten yang mendorong serangan terhadap orang atau kelompok.",
      sourceUrl: "https://www.facebook.com/help/instagram/477434105621119",
    },
    {
      name: "Ketelanjangan & Konten Seksual",
      description: "Ketelanjangan atau konten seksual yang dilarang oleh pedoman komunitas Instagram.",
      sourceUrl: "https://www.facebook.com/help/instagram/477434105621119",
    },
    {
      name: "Eksploitasi Seksual Anak",
      description: "Konten yang melibatkan eksploitasi atau seksualisasi anak di bawah umur.",
      sourceUrl: "https://www.facebook.com/help/instagram/477434105621119",
    },
    {
      name: "Bunuh Diri & Menyakiti Diri",
      description: "Konten yang mendorong, mengglorifikasi, atau memfasilitasi tindakan menyakiti diri sendiri.",
      sourceUrl: "https://www.facebook.com/help/instagram/477434105621119",
    },
    {
      name: "Spam & Aktivitas Tidak Autentik",
      description: "Spam, interaksi berulang yang tidak diinginkan, atau manipulasi interaksi yang tidak autentik.",
      sourceUrl: "https://www.facebook.com/help/instagram/477434105621119",
    },
    {
      name: "Penipuan & Deception",
      description: "Konten atau aktivitas yang menipu, termasuk skema penipuan dan penyamaran identitas.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Privasi & Informasi Pribadi",
      description: "Penyebaran informasi pribadi yang digunakan untuk mengancam, memeras, atau melecehkan.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Hak Kekayaan Intelektual",
      description: "Konten yang melanggar hak cipta atau hak merek pihak lain.",
      sourceUrl: "https://www.facebook.com/help/instagram/477434105621119",
    },
    {
      name: "Produk & Aktivitas yang Diatur",
      description: "Penawaran atau perdagangan barang/jasa tertentu yang dibatasi atau dilarang oleh kebijakan platform.",
      sourceUrl: "https://www.facebook.com/help/instagram/477434105621119",
    },
  ],

  FACEBOOK: [
    {
      name: "Kekerasan & Hasutan",
      description: "Ancaman, hasutan, atau konten yang mendorong tindakan kekerasan terhadap orang atau kelompok.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Organisasi & Individu Berbahaya",
      description: "Dukungan atau promosi organisasi atau individu yang masuk kategori berbahaya menurut kebijakan Meta.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Ujaran Kebencian",
      description: "Serangan atau penghinaan berbasis karakteristik yang dilindungi.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Pelecehan & Perundungan",
      description: "Konten atau perilaku yang menargetkan orang untuk mengganggu, merendahkan, atau mempermalukan.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Eksploitasi Seksual Anak",
      description: "Konten yang melibatkan eksploitasi seksual atau seksualisasi anak di bawah umur.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Ketelanjangan & Aktivitas Seksual",
      description: "Ketelanjangan atau aktivitas seksual yang dilarang oleh kebijakan Meta.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Bunuh Diri & Menyakiti Diri",
      description: "Konten yang mendorong, mengglorifikasi, atau memfasilitasi self-harm atau bunuh diri.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Penipuan & Deception",
      description: "Penipuan, scam, manipulasi, atau praktik menyesatkan.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Spam & Perilaku Tidak Autentik",
      description: "Spam atau perilaku yang memanipulasi interaksi dan pengalaman pengguna.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Privasi & Informasi Pribadi",
      description: "Penyebaran informasi pribadi untuk mengancam, memeras, atau melecehkan.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Hak Kekayaan Intelektual",
      description: "Pelanggaran hak cipta atau merek dagang.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
    {
      name: "Konten Kekerasan/Grafis",
      description: "Konten kekerasan grafis yang melanggar batasan kebijakan yang berlaku.",
      sourceUrl: "https://transparency.meta.com/policies/community-standards/",
    },
  ],

  TIKTOK: [
    {
      name: "Violent and Criminal Behavior",
      description: "Konten terkait kekerasan atau perilaku kriminal yang dilarang oleh Community Guidelines TikTok.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en",
    },
    {
      name: "Hate Speech & Hateful Behavior",
      description: "Ujaran atau perilaku kebencian yang menyerang individu atau kelompok berdasarkan atribut yang dilindungi.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en/safety-civility",
    },
    {
      name: "Harassment & Bullying",
      description: "Pelecehan, perundungan, atau perilaku yang menyerang target tertentu.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en/safety-civility",
    },
    {
      name: "Human Trafficking & Smuggling",
      description: "Konten yang memfasilitasi, mempromosikan, atau mendukung perdagangan manusia atau penyelundupan.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en/safety-civility",
    },
    {
      name: "Youth Safety & Sexual Exploitation",
      description: "Konten yang membahayakan, mengeksploitasi, atau menseksualisasi anak dan remaja.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en/safety-civility",
    },
    {
      name: "Suicide & Self-Harm",
      description: "Konten yang mendorong atau mengglorifikasi bunuh diri atau self-harm.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en/safety-civility",
    },
    {
      name: "Dangerous Activity & Challenges",
      description: "Konten yang mendorong aktivitas berbahaya atau challenge yang dapat menyebabkan cedera.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en/safety-civility",
    },
    {
      name: "Sexual Content & Nudity",
      description: "Aktivitas seksual, ketelanjangan, atau konten seksual yang dibatasi.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en",
    },
    {
      name: "Graphic & Shocking Content",
      description: "Konten grafis atau mengejutkan yang melampaui batas yang diizinkan platform.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en",
    },
    {
      name: "Misinformation",
      description: "Informasi menyesatkan yang termasuk dalam kategori yang dilarang oleh kebijakan TikTok.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en",
    },
    {
      name: "Civic & Election Integrity",
      description: "Konten atau perilaku yang dapat mengganggu integritas proses sipil atau pemilu.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en",
    },
    {
      name: "AI-Generated & Manipulated Media",
      description: "Media hasil rekayasa atau AI yang menyesatkan atau melanggar ketentuan pelabelan/konteks.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en",
    },
    {
      name: "Fake Engagement, Spam & Deceptive Behavior",
      description: "Spam, engagement palsu, perilaku manipulatif, atau praktik menipu.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en",
    },
    {
      name: "Regulated Goods & Activities",
      description: "Barang atau aktivitas yang diatur dan dibatasi oleh kebijakan TikTok.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en",
    },
    {
      name: "Personal Information & Privacy",
      description: "Konten yang mengekspos informasi pribadi atau melanggar privasi.",
      sourceUrl: "https://www.tiktok.com/community-guidelines/en",
    },
  ],

  X: [
    {
      name: "Tutur Kekerasan",
      description: "Mengancam, menghasut, mengagungkan, atau menyatakan keinginan mencelakakan atau melakukan kekerasan.",
      sourceUrl: "https://help.x.com/id/rules-and-policies/x-rules",
    },
    {
      name: "Entitas Kekerasan & Kebencian",
      description: "Afiliasi atau promosi terhadap aktivitas entitas kekerasan dan kebencian.",
      sourceUrl: "https://help.x.com/id/rules-and-policies/x-rules",
    },
    {
      name: "Eksploitasi Seks Anak",
      description: "Konten eksploitasi seksual anak di bawah umur.",
      sourceUrl: "https://help.x.com/id/rules-and-policies/x-rules",
    },
    {
      name: "Penghinaan & Pelecehan",
      description: "Konten yang menghina, melecehkan seseorang, atau menghasut orang lain untuk melakukannya.",
      sourceUrl: "https://help.x.com/id/rules-and-policies/x-rules",
    },
    {
      name: "Perilaku Kebencian",
      description: "Serangan terhadap pengguna berdasarkan karakteristik yang dilindungi.",
      sourceUrl: "https://help.x.com/id/rules-and-policies/x-rules",
    },
    {
      name: "Informasi Pribadi & Doxxing",
      description: "Publikasi informasi pribadi orang lain tanpa izin atau ancaman untuk membocorkannya.",
      sourceUrl: "https://help.x.com/en/rules-and-policies/x-rules",
    },
    {
      name: "Ketelanjangan Intim Tanpa Persetujuan",
      description: "Menyebarkan gambar atau video intim seseorang yang dibuat atau dibagikan tanpa persetujuan.",
      sourceUrl: "https://help.x.com/en/rules-and-policies/x-rules",
    },
    {
      name: "Manipulasi Platform & Spam",
      description: "Perilaku tidak autentik yang memanipulasi platform, amplifikasi, atau pengalaman pengguna.",
      sourceUrl: "https://help.x.com/id/rules-and-policies/x-rules",
    },
    {
      name: "Integritas Kewarganegaraan",
      description: "Upaya untuk memanipulasi atau mengganggu pemilu atau aktivitas kewarganegaraan.",
      sourceUrl: "https://help.x.com/id/rules-and-policies/x-rules",
    },
    {
      name: "Identitas Menyesatkan & Peniruan",
      description: "Peniruan individu, kelompok, atau organisasi untuk menyesatkan atau menipu pihak lain.",
      sourceUrl: "https://help.x.com/id/rules-and-policies/x-rules",
    },
    {
      name: "Media Hasil Rekayasa / Manipulasi",
      description: "Media yang dimanipulasi atau dibagikan di luar konteks secara menyesatkan dan dapat membahayakan.",
      sourceUrl: "https://help.x.com/id/rules-and-policies/x-rules",
    },
    {
      name: "Scam & Penipuan",
      description: "Taktik penipuan seperti social engineering, phishing, atau skema memperoleh uang/informasi pribadi.",
      sourceUrl: "https://help.x.com/en/rules-and-policies/authenticity",
    },
    {
      name: "Malicious & Deceptive URLs",
      description: "Tautan berbahaya, phishing, malware, atau tautan yang menyesatkan tujuan akhirnya.",
      sourceUrl: "https://help.x.com/en/rules-and-policies/authenticity",
    },
    {
      name: "Hak Cipta & Merek Dagang",
      description: "Pelanggaran terhadap hak kekayaan intelektual, termasuk copyright dan trademark.",
      sourceUrl: "https://help.x.com/id/rules-and-policies/x-rules",
    },
    {
      name: "Kompromi Akun",
      description: "Upaya mengakses atau mengubah akun X orang lain tanpa otorisasi.",
      sourceUrl: "https://help.x.com/en/rules-and-policies/x-rules",
    },
  ],

  YOUTUBE: [
    {
      name: "Spam & Praktik Menipu",
      description: "Spam, scam, praktik menyesatkan, peniruan identitas, link tertentu, atau interaksi palsu.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
    {
      name: "Peniruan Identitas",
      description: "Konten atau akun yang menyesatkan dengan meniru individu, channel, atau organisasi lain.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
    {
      name: "Interaksi Palsu",
      description: "Manipulasi views, likes, komentar, subscriber, atau metrik lain secara tidak autentik.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
    {
      name: "Konten Seksual & Ketelanjangan",
      description: "Ketelanjangan atau konten seksual yang melanggar pedoman komunitas YouTube.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
    {
      name: "Keselamatan Anak",
      description: "Konten yang membahayakan atau mengeksploitasi anak.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
    {
      name: "Bunuh Diri, Self-Harm & Gangguan Pola Makan",
      description: "Konten terkait bunuh diri, menyakiti diri, atau gangguan pola makan yang dilarang.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
    {
      name: "Konten Merugikan & Berbahaya",
      description: "Konten yang mendorong aktivitas berbahaya atau dapat menyebabkan kerugian serius.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
    {
      name: "Kekerasan & Konten Grafis",
      description: "Kekerasan atau konten grafis yang melanggar pedoman YouTube.",
      sourceUrl: "https://support.google.com/youtube/answer/2802008?hl=id",
    },
    {
      name: "Ujaran Kebencian",
      description: "Konten yang menyerang kelompok berdasarkan karakteristik yang dilindungi.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
    {
      name: "Pelecehan & Cyberbullying",
      description: "Pelecehan, ancaman, atau cyberbullying yang ditujukan kepada individu atau kelompok.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
    {
      name: "Organisasi Kriminal Kekerasan",
      description: "Konten yang memuji atau mempromosikan organisasi kriminal yang melakukan kekerasan.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
    {
      name: "Barang atau Jasa yang Diatur",
      description: "Penjualan, pemberian link, atau fasilitasi akses terhadap barang/jasa yang diatur atau ilegal.",
      sourceUrl: "https://support.google.com/youtube/answer/9229611?hl=id",
    },
    {
      name: "Misinformasi",
      description: "Misinformasi tertentu yang berisiko menimbulkan bahaya serius atau mengganggu proses demokrasi.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
    {
      name: "Hak Cipta",
      description: "Konten yang diduga menggunakan materi berhak cipta tanpa hak yang sesuai.",
      sourceUrl: "https://support.google.com/youtube/answer/9288567?hl=id",
    },
  ],
};

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
    create: {
      username: "admin",
      name: "System Administrator",
      email: "admin@reporthub.local",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { username: "user" },
    update: {
      passwordHash: userPassword,
      role: Role.USER,
    },
    create: {
      username: "user",
      name: "Demo User",
      email: "user@reporthub.local",
      passwordHash: userPassword,
      role: Role.USER,
    },
  });

  const names = [
    ["TikTok", "TIKTOK", "https://www.tiktok.com"],
    ["Instagram", "INSTAGRAM", "https://www.instagram.com"],
    ["Facebook", "FACEBOOK", "https://www.facebook.com"],
    ["YouTube", "YOUTUBE", "https://www.youtube.com"],
    ["X", "X", "https://x.com"],
  ];

  for (const [name, code, baseUrl] of names) {
    await prisma.platform.upsert({
      where: { code },
      update: {
        name,
        baseUrl,
        active: true,
      },
      create: {
        name,
        code,
        baseUrl,
        active: true,
      },
    });
  }

  for (const [platformCode, policies] of Object.entries(policyCatalog)) {
    const platform = await prisma.platform.findUnique({
      where: { code: platformCode },
    });

    if (!platform) continue;

    for (const policy of policies) {
      await prisma.policy.upsert({
        where: {
          platformId_name: {
            platformId: platform.id,
            name: policy.name,
          },
        },
        update: {
          description: policy.description,
          version: POLICY_VERSION,
          sourceUrl: policy.sourceUrl,
          active: true,
        },
        create: {
          platformId: platform.id,
          name: policy.name,
          description: policy.description,
          version: POLICY_VERSION,
          sourceUrl: policy.sourceUrl,
          active: true,
        },
      });
    }
  }

  const instagram = await prisma.platform.findUnique({
    where: { code: "INSTAGRAM" },
  });

  if (instagram) {
    const firstPolicy = await prisma.policy.findFirst({
      where: {
        platformId: instagram.id,
        active: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const existing = await prisma.report.findUnique({
      where: { reportCode: "RPT-2026-000001" },
    });

    if (!existing) {
      await prisma.report.create({
        data: {
          reportCode: "RPT-2026-000001",
          reporterId: user.id,
          createdById: user.id,
          platformId: instagram.id,
          policyId: firstPolicy?.id,
          contentType: "POST",
          url: "https://www.instagram.com/example",
          description: firstPolicy?.name || "Demo report for development.",
          status: "UNDER_REVIEW",
        },
      });
    }
  }

  console.log(
    `Seeded admin=${admin.username}, user=${user.username}, policy catalog=${Object.values(policyCatalog).flat().length}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
