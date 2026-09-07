

Wes analysis lab · JSX
import { useState, useEffect } from "react";
 
const PIPELINE_STAGES = [
  {
    id: "intro",
    icon: "🧬",
    title: "WES란 무엇인가?",
    subtitle: "시작하기 전에 알아야 할 기초",
    conceptDepth: [
      {
        q: "DNA가 뭔지는 아는데, 'exome'이 뭐예요?",
        a: "DNA는 약 30억 글자(A, T, G, C)로 이루어진 아주 긴 설명서예요. 이 설명서 전체를 '게놈(genome)'이라고 해요.\n\n그런데 이 30억 글자 중 실제로 단백질을 만드는 '레시피' 부분은 겨우 1~2%뿐이에요. 이 핵심 레시피 부분만 모아놓은 걸 **엑솜(exome)**이라고 합니다.\n\n비유하면: 백과사전 전체가 genome이라면, 그중 '핵심 키워드 목록'만 뽑아놓은 게 exome이에요."
      },
      {
        q: "WES는 왜 하나요? 전체 DNA를 다 읽으면 안 되나요?",
        a: "전체 DNA를 다 읽는 건 WGS(Whole Genome Sequencing)라고 하는데, 비용이 훨씬 비싸요.\n\nWES(Whole Exome Sequencing)는 단백질을 만드는 핵심 부분(exome)만 집중적으로 읽기 때문에:\n• 비용이 WGS의 1/3~1/5 수준\n• 데이터 크기도 작아서 분석이 빠름\n• 암을 유발하는 돌연변이의 대부분(약 85%)이 이 exome 영역에 있음\n\n비유: 범인을 찾을 때 도시 전체(WGS)를 수색하는 대신, 범행 현장 주변(WES)만 집중 수색하는 것과 같아요."
      },
      {
        q: "'시퀀싱(sequencing)'이 뭐예요?",
        a: "시퀀싱은 DNA의 글자(A, T, G, C)를 순서대로 읽어내는 기술이에요.\n\n과정을 간단히 보면:\n1. 환자의 혈액이나 종양 조직에서 DNA를 추출\n2. DNA를 아주 작은 조각(약 150~300글자)으로 자름\n3. 기계(시퀀서)가 각 조각의 글자를 읽어냄\n4. 컴퓨터가 이 조각들을 원래 위치에 맞춰 조립\n\n비유: 책을 잘게 찢은 후, 각 조각의 글자를 읽고, 원래 페이지 순서대로 다시 맞추는 퍼즐 작업이에요."
      },
      {
        q: "WES 분석으로 뭘 알 수 있어요?",
        a: "암 환자의 종양에서 어떤 DNA 글자가 바뀌었는지(돌연변이) 찾아냅니다.\n\n예를 들어 췌장암에서:\n• KRAS 유전자의 12번째 위치가 G→D로 바뀜 → 암세포가 계속 증식하는 신호를 보냄\n• TP53 유전자가 망가짐 → 암 억제 브레이크가 고장\n• SMAD4 유전자가 소실 → TGF-β 신호가 엉킴\n\n이런 정보로 환자에게 맞는 표적치료제를 선택하거나, 암의 특성을 이해할 수 있어요."
      },
    ],
    keyParams: [],
    tools: [
      { name: "개념 이해", color: "#10b981" },
    ],
    interpretation: "이 단계는 배경 지식을 쌓는 단계예요. 다음 단계부터 실제 데이터를 다루기 시작합니다.",
  },
  {
    id: "fastq",
    icon: "📄",
    title: "FASTQ 파일 이해",
    subtitle: "시퀀싱 데이터의 원본 형태",
    conceptDepth: [
      {
        q: "FASTQ 파일이 뭐예요?",
        a: "시퀀서 기계가 DNA 조각을 읽고 나면, 그 결과를 텍스트 파일로 저장하는데 이게 FASTQ 파일이에요.\n\n각 DNA 조각(read)마다 4줄의 정보가 기록됩니다:\n• 1줄: 조각의 이름표 (@ 로 시작)\n• 2줄: 읽어낸 DNA 글자 (ATCGATCG...)\n• 3줄: 구분선 (+)\n• 4줄: 각 글자를 얼마나 정확하게 읽었는지 '신뢰도 점수'\n\n비유: 시험 답안지에 '학생 이름(1줄), 답(2줄), 구분선(3줄), 각 문항의 확신도(4줄)'를 적은 것과 같아요."
      },
      {
        q: "'Read'가 뭐예요?",
        a: "DNA를 작은 조각으로 잘라서 읽었을 때, 그 하나의 조각을 read라고 해요.\n\n보통 하나의 read는 약 150글자 정도 길이예요. WES 데이터 하나에는 수천만~수억 개의 read가 들어있습니다.\n\n비유: 책을 찢어서 조각낸 하나하나의 '쪽지'가 read예요. 원래 책을 복원하려면 이 쪽지들을 원래 위치에 맞춰야 합니다."
      },
      {
        q: "Paired-end 시퀀싱이 뭐예요?",
        a: "DNA 조각의 양쪽 끝을 각각 읽는 방식이에요.\n\n하나의 DNA 조각에서:\n• 앞쪽부터 150글자 읽기 → Read 1 (R1 파일)\n• 뒤쪽부터 150글자 읽기 → Read 2 (R2 파일)\n\n그래서 WES 데이터는 보통 2개의 FASTQ 파일로 나옵니다.\n\n비유: 터널의 양쪽 입구에서 각각 탐색하면, 한쪽에서만 들어가는 것보다 터널 내부를 더 정확하게 파악할 수 있어요."
      },
    ],
    keyParams: [
      { name: "read_length", label: "Read 길이", default: 150, desc: "보통 150bp (Illumina 기준)" },
      { name: "expected_coverage", label: "목표 Coverage", default: "100x", desc: "각 위치를 평균 100번 읽기" },
    ],
    tools: [
      { name: "FastQC", color: "#f59e0b" },
      { name: "MultiQC", color: "#8b5cf6" },
    ],
    interpretation: "FastQC 리포트에서 Per base quality가 대부분 초록색(Q30 이상)이면 좋은 데이터예요. 빨간색이 많으면 시퀀싱 품질에 문제가 있을 수 있습니다.",
  },
  {
    id: "qc",
    icon: "🔍",
    title: "품질 관리 (QC)",
    subtitle: "낮은 품질의 데이터 정리",
    conceptDepth: [
      {
        q: "왜 품질 관리를 해야 하나요?",
        a: "시퀀서가 DNA를 읽을 때, 가끔 글자를 잘못 읽어요. 특히 read의 끝부분으로 갈수록 정확도가 떨어집니다.\n\n잘못 읽은 글자를 그대로 분석하면, 진짜 돌연변이가 아닌데 돌연변이로 오판할 수 있어요.\n\n비유: 흐릿한 사진으로 범인을 식별하면 오판할 수 있으니, 선명한 사진만 남기고 흐릿한 건 버리는 것과 같아요."
      },
      {
        q: "Quality Score(품질 점수)가 뭐예요?",
        a: "각 글자를 얼마나 정확하게 읽었는지를 숫자로 나타낸 거예요.\n\n• Q30 = 1000번 중 1번 틀릴 확률 (99.9% 정확) → ✅ 좋음\n• Q20 = 100번 중 1번 틀릴 확률 (99% 정확) → ⚠️ 보통\n• Q10 = 10번 중 1번 틀릴 확률 (90% 정확) → ❌ 나쁨\n\n보통 Q30 이상인 글자만 신뢰합니다. WES 분석에서는 Q20 미만인 부분을 잘라내요(trimming)."
      },
      {
        q: "Adapter가 뭐예요? 왜 제거해야 하나요?",
        a: "시퀀싱을 하려면 DNA 조각 양쪽에 '어댑터'라는 인공 DNA 조각을 붙여야 해요. 시퀀서가 DNA를 인식하는 손잡이 같은 거예요.\n\n문제는 read가 짧거나 DNA 조각이 작으면, 시퀀서가 어댑터까지 읽어버려요. 이건 원래 환자 DNA가 아니니까 제거해야 합니다.\n\n비유: 책 내용을 복사할 때, 책갈피(어댑터)까지 같이 복사해버린 거예요. 책갈피 부분은 지워야죠."
      },
      {
        q: "컴퓨터에서 어떻게 실행하나요?",
        a: "여기서부터 '명령어'를 사용합니다. 우리가 평소 쓰는 컴퓨터는 마우스로 클릭하지만, 생물정보학에서는 '터미널(terminal)'이라는 검은 화면에 글자로 명령을 내려요.\n\n이런 텍스트 명령어를 **'커맨드라인(command line)'**이라고 합니다.\n\n예시:\nfastp -i input_R1.fastq.gz -I input_R2.fastq.gz -o clean_R1.fastq.gz -O clean_R2.fastq.gz\n\n이 한 줄이 '입력 파일(input)을 정리해서 깨끗한 출력 파일(output)로 저장해라'는 뜻이에요.\n\n무서워 보이지만, 각 부분의 의미를 알면 레고 조립하듯 이해할 수 있어요!"
      },
    ],
    keyParams: [
      { name: "min_quality", label: "최소 품질 점수", default: 20, desc: "Q20 미만인 글자는 잘라냄" },
      { name: "min_length", label: "최소 read 길이", default: 50, desc: "50bp 미만인 read는 버림" },
      { name: "adapter_trim", label: "어댑터 제거", default: "자동 감지", desc: "fastp가 자동으로 어댑터를 찾아 제거" },
    ],
    tools: [
      { name: "fastp", color: "#ef4444" },
      { name: "Trimmomatic", color: "#3b82f6" },
    ],
    interpretation: "QC 후 남은 read 비율이 90% 이상이면 좋은 데이터입니다. 70% 미만이면 시퀀싱 품질 자체에 문제가 있을 수 있어요.",
  },
  {
    id: "alignment",
    icon: "🧩",
    title: "정렬 (Alignment)",
    subtitle: "Read를 참조 유전체에 맞추기",
    conceptDepth: [
      {
        q: "정렬(alignment)이 뭐예요?",
        a: "수천만 개의 짧은 DNA 조각(read)이 원래 유전체의 어디에서 왔는지 찾아서 배치하는 과정이에요.\n\n'참조 유전체(reference genome)'라는 '정답지'가 있는데, 여기에 각 read를 맞춰보는 거예요.\n\n비유: 퍼즐 조각 수천만 개를 원래 그림(참조 유전체)에 하나하나 맞추는 작업이에요. 컴퓨터가 수시간에 걸쳐 처리합니다."
      },
      {
        q: "참조 유전체(reference genome)가 뭐예요?",
        a: "인류 전체를 대표하는 '표준 유전체 지도'예요. 수많은 사람의 DNA를 종합해서 만든 '가장 보편적인' 인간 DNA 서열입니다.\n\n현재 가장 많이 쓰이는 버전:\n• hg38 (= GRCh38): 최신 표준\n• hg19 (= GRCh37): 옛날 버전이지만 아직도 많이 사용\n\n우리 환자의 DNA를 이 표준과 비교해서, '어디가 다른지(돌연변이)'를 찾는 거예요.\n\n비유: 원본 악보(참조 유전체)와 연주 녹음(환자 DNA)을 비교해서, 연주자가 어떤 음을 틀렸는지(돌연변이) 찾는 것과 같아요."
      },
      {
        q: "BAM 파일이 뭐예요?",
        a: "정렬 결과를 저장하는 파일이에요. '각 read가 유전체의 어느 위치에 맞춰졌는지'가 기록되어 있습니다.\n\n• SAM 파일: 사람이 읽을 수 있는 텍스트 형태 (매우 큼)\n• BAM 파일: 컴퓨터가 읽기 좋게 압축한 형태 (실제 사용)\n\nWES 데이터 하나의 BAM 파일은 보통 5~15GB 정도예요.\n\n비유: SAM은 원본 문서, BAM은 그 문서를 zip으로 압축한 것이에요."
      },
      {
        q: "BWA, STAR 같은 건 뭐예요?",
        a: "정렬을 해주는 '프로그램(도구)'의 이름이에요.\n\n• **BWA-MEM2**: DNA 시퀀싱(WES, WGS)에 가장 많이 쓰이는 정렬 도구\n• **STAR**: RNA 시퀀싱에 주로 쓰임 (RNA는 인트론이 잘려나가므로 다른 방식 필요)\n\nWES에서는 BWA-MEM2를 사용합니다.\n\n비유: 번역기에도 구글 번역, 파파고 등 다양한 종류가 있듯이, 정렬 도구도 여러 종류가 있고 상황에 맞는 걸 선택해요."
      },
    ],
    keyParams: [
      { name: "reference", label: "참조 유전체", default: "hg38 (GRCh38)", desc: "인간 표준 유전체 최신 버전" },
      { name: "aligner", label: "정렬 도구", default: "BWA-MEM2", desc: "WES 표준 정렬 도구" },
      { name: "sort_order", label: "정렬 순서", default: "coordinate", desc: "유전체 위치 순서로 정렬" },
    ],
    tools: [
      { name: "BWA-MEM2", color: "#0ea5e9" },
      { name: "SAMtools", color: "#14b8a6" },
      { name: "Picard", color: "#f97316" },
    ],
    interpretation: "Mapping rate(정렬 성공률)가 95% 이상이면 정상입니다. 80% 미만이면 샘플 오염이나 시퀀싱 문제를 의심하세요. 중복 read(PCR duplicates) 비율은 보통 10~30%이며, 이 단계에서 표시(marking)해둡니다.",
  },
  {
    id: "variant_calling",
    icon: "🔎",
    title: "변이 검출 (Variant Calling)",
    subtitle: "돌연변이 찾기",
    conceptDepth: [
      {
        q: "변이(variant)가 뭐예요?",
        a: "참조 유전체(표준)와 비교했을 때, 환자의 DNA에서 다른 글자가 발견된 위치를 '변이(variant)'라고 해요.\n\n변이의 종류:\n• **SNV** (Single Nucleotide Variant): 글자 1개가 바뀐 것\n  예: ...ATG**C**TA... → ...ATG**T**TA...\n  가장 흔하고, 암 연구에서 가장 중요\n\n• **Indel** (Insertion/Deletion): 글자가 추가되거나 빠진 것\n  예: ...ATGCTA... → ...ATG__TA... (2글자 삭제)\n\n• **CNV** (Copy Number Variation): 유전자가 통째로 복사되거나 삭제된 것\n\n비유: 책의 오탈자예요. SNV는 글자 하나가 바뀐 것, Indel은 단어가 빠지거나 추가된 것, CNV는 페이지가 통째로 복사되거나 찢겨나간 것."
      },
      {
        q: "Somatic vs Germline이 뭐예요?",
        a: "이건 정말 중요한 구분이에요!\n\n• **Germline 변이**: 부모에게 물려받은 변이. 몸의 모든 세포에 존재. '체질'에 해당.\n  예: BRCA1 유전자 변이 → 유방암/난소암 위험 증가 (가족력)\n\n• **Somatic 변이**: 살면서 후천적으로 생긴 변이. 종양 세포에만 존재. '암의 원인'.\n  예: KRAS G12D 변이 → 이 변이가 있는 세포만 암이 됨\n\n구분하는 방법: 같은 환자의 종양(tumor)과 정상 조직(normal, 보통 혈액)을 함께 시퀀싱해서 비교. 종양에만 있는 변이 = somatic.\n\n비유: 원래 설계도(germline)에 있던 변경점 vs 건물 사용 중 생긴 균열(somatic)의 차이예요."
      },
      {
        q: "GATK가 뭔가요?",
        a: "**GATK (Genome Analysis Toolkit)**은 미국 Broad Institute에서 만든 유전체 분석 도구 모음이에요. 변이 검출의 '국제 표준'으로, 거의 모든 WES 논문에서 사용합니다.\n\nGATK의 핵심 도구:\n• **HaplotypeCaller**: Germline 변이 검출\n• **Mutect2**: Somatic 변이 검출 (암 연구의 핵심!)\n\n비유: 과학계의 '공인 측정기관'이 GATK라고 생각하면 돼요. 다른 도구도 있지만, GATK를 기준으로 비교하는 게 관례예요."
      },
      {
        q: "VCF 파일이 뭐예요?",
        a: "발견된 모든 변이를 기록한 파일이에요. 한 줄에 하나의 변이 정보가 담겨있습니다.\n\n각 변이마다 기록되는 정보:\n• **어디서?** - 몇 번 염색체, 몇 번째 위치\n• **뭐가 바뀌었나?** - 원래 글자 → 바뀐 글자\n• **얼마나 확실한가?** - 품질 점수\n• **얼마나 자주 보이나?** - 전체 read 중 변이를 가진 read 비율(VAF)\n\n비유: 건물 점검 보고서예요. '3층 201호 벽(위치)에 균열(변이)이 발견됨, 심각도: 중(품질 점수)' 이런 식으로 기록됩니다."
      },
    ],
    keyParams: [
      { name: "caller", label: "변이 검출 도구", default: "GATK Mutect2", desc: "암 연구 표준 (somatic 변이)" },
      { name: "min_vaf", label: "최소 VAF", default: 0.05, desc: "5% 이상 read에서 보여야 변이로 인정" },
      { name: "min_depth", label: "최소 read depth", default: 20, desc: "해당 위치를 최소 20번 읽었어야 함" },
      { name: "normal_sample", label: "정상 샘플", default: "필요 (혈액 등)", desc: "Somatic 변이 구분에 필수" },
    ],
    tools: [
      { name: "GATK", color: "#dc2626" },
      { name: "Mutect2", color: "#b91c1c" },
      { name: "Strelka2", color: "#7c3aed" },
    ],
    interpretation: "일반적으로 WES에서 somatic 변이는 수십~수백 개 검출됩니다. 췌장암(PDAC)은 보통 30~60개 정도의 nonsynonymous 변이가 나옵니다. KRAS, TP53, SMAD4, CDKN2A가 4대 driver gene이에요.",
  },
  {
    id: "annotation",
    icon: "📝",
    title: "변이 주석 (Annotation)",
    subtitle: "각 변이의 의미 해석",
    conceptDepth: [
      {
        q: "Annotation(주석)이 왜 필요한가요?",
        a: "변이 검출 단계에서는 '몇 번 염색체, 몇 번째 위치에서 A가 G로 바뀌었다'는 사실만 알려줘요.\n\n하지만 우리가 정말 알고 싶은 건:\n• 이 변이가 어떤 유전자에 있는지\n• 단백질을 바꾸는 변이인지 (의미 있는 변이인지)\n• 이미 알려진 암 관련 변이인지\n• 다른 환자에서도 발견된 적이 있는지\n\nAnnotation은 이런 '맥락 정보'를 변이에 달아주는 과정이에요.\n\n비유: 지도에서 좌표(위치)만 알면 의미가 없고, '이 좌표는 서울역이고, 지하철 1호선과 4호선이 지나간다'는 설명을 붙여야 쓸모 있는 것과 같아요."
      },
      {
        q: "변이의 종류(효과)에는 뭐가 있나요?",
        a: "변이가 단백질에 미치는 영향에 따라 분류합니다:\n\n🟢 **Synonymous (동의 변이)**: DNA 글자는 바뀌었지만 단백질은 같음\n  → 대부분 무해 (3글자 코드의 '같은 뜻 다른 말')\n\n🟡 **Missense (과오 변이)**: 아미노산 1개가 다른 것으로 바뀜\n  → 기능에 영향을 줄 수도, 안 줄 수도 있음\n  예: KRAS G12D = 12번째 아미노산이 G(글리신)→D(아스파르트산)으로 변경\n\n🔴 **Nonsense (넌센스 변이)**: 단백질 합성이 중간에 멈춤 (정지 코돈 생성)\n  → 단백질 기능 상실, 보통 해로움\n\n🔴 **Frameshift (틀이동 변이)**: 글자가 추가/삭제되어 이후 전체가 엉킴\n  → 단백질이 완전히 망가짐\n\n🟡 **Splice site 변이**: 유전자 편집 지점이 망가짐\n  → 비정상 단백질 생성\n\n비유: 문장에서 글자 하나가 바뀌었을 때 — '사과'→'사고'(missense), '사과'→'사.'(nonsense, 문장 끊김), '사과가'→'사가과'(frameshift, 이후 전부 의미 없음)"
      },
      {
        q: "ANNOVAR, VEP가 뭐예요?",
        a: "변이에 주석을 달아주는 도구(프로그램)의 이름이에요.\n\n• **ANNOVAR**: 가장 오래되고 널리 쓰이는 주석 도구. 다양한 데이터베이스 지원.\n• **VEP** (Variant Effect Predictor): Ensembl에서 만든 도구. 변이의 효과를 예측.\n\n이 도구들이 참조하는 데이터베이스:\n• **ClinVar**: 임상적으로 알려진 변이 정보 (병원성 여부)\n• **COSMIC**: 암에서 발견된 변이 데이터베이스 (암 연구 필수!)\n• **gnomAD**: 일반 인구에서의 변이 빈도 (흔한 변이 걸러내기용)\n• **dbSNP**: 알려진 모든 변이의 카탈로그\n\n비유: 범인의 지문(변이)을 찍었으면, 지문 데이터베이스(ClinVar, COSMIC)에서 전과 기록을 조회하는 거예요."
      },
    ],
    keyParams: [
      { name: "tool", label: "주석 도구", default: "ANNOVAR", desc: "가장 범용적인 변이 주석 도구" },
      { name: "databases", label: "참조 DB", default: "ClinVar, COSMIC, gnomAD", desc: "임상 의미, 암 DB, 인구 빈도" },
      { name: "pop_freq_filter", label: "인구 빈도 필터", default: 0.01, desc: "gnomAD에서 1% 이상이면 제외 (흔한 변이)" },
    ],
    tools: [
      { name: "ANNOVAR", color: "#0d9488" },
      { name: "VEP", color: "#6366f1" },
      { name: "ClinVar", color: "#ec4899" },
      { name: "COSMIC", color: "#f59e0b" },
    ],
    interpretation: "gnomAD 인구 빈도 > 1%인 변이는 보통 germline 다형성(정상 변이)이므로 제거합니다. Nonsynonymous + COSMIC에 등록된 + 인구 빈도 낮은 변이가 암 driver 후보예요.",
  },
  {
    id: "interpretation",
    icon: "🎯",
    title: "임상적 해석",
    subtitle: "Driver 변이 & TMB & Signature",
    conceptDepth: [
      {
        q: "Driver 변이 vs Passenger 변이가 뭐예요?",
        a: "암세포에서 발견되는 수십~수백 개의 변이가 모두 암의 원인은 아니에요.\n\n• **Driver 변이**: 실제로 암 발생/진행을 '운전(drive)'하는 핵심 변이. 소수.\n  예: KRAS G12D, TP53 R175H\n\n• **Passenger 변이**: 암 발생과 무관하게 우연히 함께 있는 변이. 다수.\n  암세포가 빠르게 분열하면서 무작위로 쌓인 '승객(passenger)'\n\n구분하는 기준:\n• 알려진 암 유전자(COSMIC Cancer Gene Census)에 있는가?\n• 같은 위치의 변이가 다른 암 환자에서도 반복 발견되는가?\n• 단백질 기능을 망가뜨리는 종류인가?\n\n비유: 교통사고 현장에서, 사고를 낸 운전자(driver)와 같이 타고 있던 승객(passenger)을 구분하는 것과 같아요."
      },
      {
        q: "TMB (Tumor Mutational Burden)가 뭐예요?",
        a: "종양에 돌연변이가 얼마나 많은지를 숫자로 나타낸 것이에요.\n\n계산법: (nonsynonymous 변이 수) ÷ (분석한 엑솜 크기 in Mb)\n단위: mutations/Mb (메가베이스당 변이 수)\n\n임상적 의미:\n• TMB 높음 (≥10 mut/Mb) → 면역치료(면역관문억제제)에 반응 가능성 ↑\n  (돌연변이가 많으면 면역세포가 인식할 '표적'이 많아져서)\n• TMB 낮음 (<10 mut/Mb) → 면역치료 효과 낮을 수 있음\n\n참고: 췌장암(PDAC)은 대부분 TMB가 낮은 편이에요 (보통 1~5 mut/Mb).\n\n비유: 범인(암세포)의 지문(변이)이 많이 남아있을수록, 경찰(면역세포)이 잡기 쉬운 것과 같아요."
      },
      {
        q: "Mutational Signature가 뭐예요?",
        a: "변이가 생기는 '원인의 지문'이에요.\n\n변이가 일어나는 패턴(어떤 글자가 어떤 글자로 바뀌는지)을 분석하면, 그 변이를 일으킨 원인을 추정할 수 있어요.\n\n대표적 signature:\n• **SBS1**: 나이가 들면서 자연 축적 (모든 암에 존재)\n• **SBS4**: 흡연 관련 (폐암에 두드러짐)\n• **SBS6**: DNA 수리 결함 (MSI-high 종양)\n• **SBS2/13**: APOBEC 효소 활성\n\n비유: 총알 자국(변이 패턴)을 분석하면 어떤 종류의 총(원인)으로 쐈는지 알 수 있는 것처럼, 변이 패턴으로 암의 원인을 역추적할 수 있어요."
      },
      {
        q: "이 결과를 어떻게 활용하나요?",
        a: "WES 분석 결과는 여러 방면으로 활용됩니다:\n\n🏥 **임상 적용**:\n• KRAS G12C 변이 발견 → Sotorasib(표적치료제) 사용 가능\n• TMB-high → 면역관문억제제(Pembrolizumab) 고려\n• BRCA1/2 변이 → PARP 억제제 고려\n\n🔬 **연구 활용**:\n• KRAS subtype별 하위 분석 → 각 subtype에 맞는 치료 전략 연구\n• CAF-관련 유전자 변이 → 종양 미세환경 이해\n• 변이 기반 neoantigen 예측 → NK cell/T cell 면역치료 전략\n\n📊 **공개 데이터와 비교**:\n• TCGA-PAAD 데이터와 비교하여 우리 샘플의 특성 파악\n• cBioPortal에서 비슷한 변이 프로필을 가진 환자의 예후 확인"
      },
    ],
    keyParams: [
      { name: "driver_db", label: "Driver 유전자 DB", default: "OncoKB + CGC", desc: "알려진 암 유전자 목록" },
      { name: "tmb_panel_size", label: "패널 크기 (Mb)", default: 36, desc: "WES 기준 약 36 Mb" },
      { name: "tmb_threshold", label: "TMB 기준", default: 10, desc: "≥10 mut/Mb = TMB-high" },
      { name: "sig_method", label: "Signature 분석", default: "MutationalPatterns", desc: "R 기반 signature 분석 패키지" },
    ],
    tools: [
      { name: "maftools", color: "#e11d48" },
      { name: "OncoKB", color: "#0891b2" },
      { name: "MutationalPatterns", color: "#7c3aed" },
    ],
    interpretation: "PDAC 4대 driver (KRAS ~95%, TP53 ~70%, SMAD4 ~30%, CDKN2A ~30%)를 먼저 확인하세요. KRAS wild-type PDAC는 매우 드물며, 다른 driver(BRAF, NTRK 등)를 찾아야 합니다.",
  },
];
 
const SYSTEM_PROMPT = `당신은 종양면역학 연구실의 생물정보학(BI) 전문가입니다.
DNA가 있다는 것만 아는 완전 초보자에게 WES(Whole Exome Sequencing) 분석을 가르칩니다.
 
핵심 원칙 (매우 중요!):
1. 모든 전문 용어를 처음 사용할 때 반드시 일상적 비유로 먼저 설명
2. "이건 아시겠지만"이라는 가정을 절대 하지 않기. 모든 것을 처음부터 설명
3. 코드를 보여줄 때는 "이 코드가 뭘 하는 건지" 한 줄 한 줄 번역하듯 설명
4. 커맨드라인(bash) 명령어는 "컴퓨터에게 내리는 명령"이라고 설명하고, 각 옵션(-i, -o 등)의 의미를 풀어서 설명
5. Python이나 R 코드도 "왜 이 언어를 쓰는지"부터 설명
6. 한 번에 너무 많은 정보를 주지 않기. 단계별로 천천히
7. 실수해도 괜찮다는 격려를 자주 하기
8. wet lab 비유를 적극 활용 (PCR, 전기영동, flow cytometry 등)
 
연구 맥락:
- 췌장암(PDAC) 종양 미세환경 연구
- KRAS mutation subtype 분석에 관심
- 서울아산병원 임상 샘플 기반
- 종양-정상 pair WES 데이터
 
응답 형식:
- 마크다운 형식
- 전문 용어에 항상 (쉬운 설명)을 괄호로 추가
- 코드 블록 전후로 충분한 설명
- "비유하면:" 으로 시작하는 비유를 자주 포함`;
 
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "relative", margin: "12px 0" }}>
      <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        style={{ position: "absolute", top: 8, right: 8, background: copied ? "#166534" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#d1d5db", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", zIndex: 2 }}>
        {copied ? "✓ 복사됨" : "복사"}
      </button>
      <pre style={{ background: "#111318", color: "#e2e8f0", padding: 16, borderRadius: 10, overflowX: "auto", fontSize: 13, lineHeight: 1.65, border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
 
function MarkdownRenderer({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const els = []; let i = 0, k = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith("```")) {
      const lang = l.slice(3).trim();
      const code = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
      els.push(<CodeBlock key={k++} code={code.join("\n")} />); i++;
    } else if (l.startsWith("### ")) {
      els.push(<h4 key={k++} style={{ color: "#fb923c", margin: "18px 0 8px", fontSize: 15, fontWeight: 600 }}>{l.slice(4)}</h4>); i++;
    } else if (l.startsWith("## ")) {
      els.push(<h3 key={k++} style={{ color: "#38bdf8", margin: "22px 0 10px", fontSize: 17, fontWeight: 700, borderBottom: "1px solid rgba(56,189,248,0.15)", paddingBottom: 6 }}>{l.slice(3)}</h3>); i++;
    } else if (l.startsWith("- ") || l.startsWith("* ")) {
      els.push(<div key={k++} style={{ display: "flex", gap: 8, margin: "4px 0 4px 8px" }}><span style={{ color: "#6b7280", flexShrink: 0 }}>•</span><span style={{ color: "#d1d5db", fontSize: 14, lineHeight: 1.7 }}>{inlineCode(l.slice(2))}</span></div>); i++;
    } else if (l.startsWith("> ")) {
      els.push(<div key={k++} style={{ borderLeft: "3px solid #fb923c", paddingLeft: 14, margin: "10px 0", color: "#9ca3af", fontSize: 14, fontStyle: "italic", lineHeight: 1.7 }}>{l.slice(2)}</div>); i++;
    } else if (l.trim() === "") { els.push(<div key={k++} style={{ height: 8 }} />); i++;
    } else { els.push(<p key={k++} style={{ color: "#d1d5db", margin: "6px 0", fontSize: 14, lineHeight: 1.8 }}>{inlineCode(l)}</p>); i++; }
  }
  return <>{els}</>;
}
 
function inlineCode(t) {
  return t.split(/(`[^`]+`)/g).map((p, i) =>
    p.startsWith("`") && p.endsWith("`")
      ? <code key={i} style={{ background: "rgba(251,146,60,0.12)", color: "#fb923c", padding: "1px 5px", borderRadius: 4, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{p.slice(1, -1)}</code>
      : p
  );
}
 
function FAQCard({ item, isOpen, onToggle }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
      <button onClick={onToggle} style={{ width: "100%", padding: "14px 18px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left" }}>
        <span style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{item.q}</span>
        <span style={{ color: "#6b7280", fontSize: 18, flexShrink: 0, marginLeft: 12, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
      </button>
      {isOpen && (
        <div style={{ padding: "0 18px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ paddingTop: 12 }}>
            {item.a.split("\n").map((line, i) => {
              if (line.startsWith("•")) return <div key={i} style={{ display: "flex", gap: 6, margin: "3px 0 3px 4px" }}><span style={{ color: "#6b7280", flexShrink: 0 }}>•</span><span style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7 }}>{line.slice(2)}</span></div>;
              if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
              const isBold = line.includes("**");
              if (isBold) {
                const parts = line.split(/\*\*([^*]+)\*\*/g);
                return <p key={i} style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.8, margin: "3px 0" }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: "#e2e8f0", fontWeight: 600 }}>{p}</strong> : p)}</p>;
              }
              return <p key={i} style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.8, margin: "3px 0" }}>{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
 
function ToolBadge({ tool }) {
  return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, background: tool.color + "18", border: `1px solid ${tool.color}40`, color: tool.color, fontSize: 11, fontWeight: 600, marginRight: 4 }}>{tool.name}</span>;
}
 
export default function WESAnalysisApp() {
  const [selectedStage, setSelectedStage] = useState(0);
  const [openFAQs, setOpenFAQs] = useState({});
  const [params, setParams] = useState({});
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [customQ, setCustomQ] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
 
  const stage = PIPELINE_STAGES[selectedStage];
 
  useEffect(() => {
    const d = {}; stage.keyParams.forEach(p => { d[p.name] = p.default; }); setParams(d);
    setAiResponse(""); setChatHistory([]);
    const initial = {}; stage.conceptDepth.forEach((_, i) => { initial[i] = i === 0; }); setOpenFAQs(initial);
  }, [selectedStage]);
 
  const toggleFAQ = (i) => setOpenFAQs(prev => ({ ...prev, [i]: !prev[i] }));
  const openAll = () => { const o = {}; stage.conceptDepth.forEach((_, i) => { o[i] = true; }); setOpenFAQs(o); };
  const closeAll = () => { const o = {}; stage.conceptDepth.forEach((_, i) => { o[i] = false; }); setOpenFAQs(o); };
 
  const generateGuide = async () => {
    setLoading(true); setAiResponse("");
    const paramStr = stage.keyParams.map(p => `${p.label}: ${params[p.name]}`).join(", ");
    const prompt = `WES 분석의 "${stage.title}" 단계에 대해 설명해주세요.
 
대상: DNA가 있다는 것만 아는 완전 초보자. 파이썬이 뭔지도, 커맨드라인이 뭔지도 모릅니다.
 
${paramStr ? `현재 파라미터: ${paramStr}` : ""}
 
다음 구조로, 매우 천천히, 매우 상세하게 작성해주세요:
 
## 🎯 이 단계에서 하는 일 (초등학생도 이해할 수 있게)
일상적 비유를 먼저 들고, 그 비유와 실제 분석을 연결해주세요.
 
## 🛠️ 사용하는 도구 소개
각 도구가 뭔지, 왜 이 도구를 쓰는지, "컴퓨터에 이 도구를 설치하는 법"부터 설명.
커맨드라인이 뭔지, 터미널을 여는 법부터 안내.
 
## 💻 실제 명령어/코드 (한 줄씩 번역)
각 명령어와 옵션(-i, -o 등)을 "컴퓨터에게 이렇게 말하는 거예요"라는 식으로 풀어서 설명.
실수했을 때 나오는 에러 메시지와 대처법도 포함.
 
## 🔬 결과 확인하기
결과 파일을 어떻게 열어보는지, 무엇을 확인해야 하는지, 좋은 결과 vs 나쁜 결과 예시.
 
## 🧪 우리 연구와의 연결
PDAC 연구에서 이 단계가 왜 중요한지, 실제 실험(Western blot, organoid 등)과 어떻게 연결되는지.`;
 
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, system: SYSTEM_PROMPT, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "응답 생성 실패";
      setAiResponse(text);
      setChatHistory([{ role: "user", content: prompt }, { role: "assistant", content: text }]);
    } catch (e) { setAiResponse("⚠️ 오류: " + e.message); }
    setLoading(false);
  };
 
  const askFollowUp = async () => {
    if (!customQ.trim() || loading) return;
    setLoading(true);
    const hist = [...chatHistory, { role: "user", content: customQ }];
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, system: SYSTEM_PROMPT, messages: hist }),
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      setAiResponse(text);
      setChatHistory([...hist, { role: "assistant", content: text }]);
      setCustomQ("");
    } catch (e) { setAiResponse("⚠️ 오류: " + e.message); }
    setLoading(false);
  };
 
  const quickQs = [
    "이 단계를 더 쉽게 설명해줘",
    "실제 명령어를 처음부터 따라할 수 있게 알려줘",
    "에러가 나면 어떻게 해야 해?",
    "PDAC 연구에서 이 단계의 주의점은?",
    "이 개념을 wet lab 실험에 비유해줘",
  ];
 
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Pretendard', -apple-system, sans-serif", background: "#0a0c10", color: "#e2e8f0", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: 280, background: "#0d0f14", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #ea580c, #fb923c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff" }}>W</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", letterSpacing: "-0.03em" }}>WES Analysis Lab</div>
              <div style={{ fontSize: 10, color: "#fb923c", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>완전 초보자를 위한 가이드</div>
            </div>
          </div>
        </div>
 
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: "#4b5563", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 8px 4px" }}>학습 로드맵</div>
          {PIPELINE_STAGES.map((s, i) => (
            <button key={s.id} onClick={() => setSelectedStage(i)} style={{
              width: "100%", display: "flex", alignItems: "flex-start", gap: 10,
              padding: "11px 12px", marginBottom: 3, borderRadius: 8,
              background: selectedStage === i ? "rgba(251,146,60,0.08)" : "transparent",
              border: selectedStage === i ? "1px solid rgba(251,146,60,0.2)" : "1px solid transparent",
              cursor: "pointer", textAlign: "left",
              color: selectedStage === i ? "#fb923c" : "#9ca3af"
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: selectedStage === i ? "rgba(251,146,60,0.15)" : "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{s.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: selectedStage === i ? 600 : 500 }}>{s.title}</div>
                <div style={{ fontSize: 10, color: "#4b5563", marginTop: 2 }}>{s.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
 
        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "#fb923c", fontWeight: 600, marginBottom: 4 }}>💡 학습 팁</div>
            <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.6 }}>모르는 용어가 나오면 언제든 AI에게 "이게 뭐야?"라고 물어보세요. 바보 같은 질문은 없어요!</div>
          </div>
        </div>
      </div>
 
      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{stage.icon}</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f3f4f6", margin: 0 }}>{selectedStage > 0 ? `Step ${selectedStage}. ` : ""}{stage.title}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>{stage.subtitle}</span>
                {stage.tools.length > 0 && <span style={{ color: "#374151" }}>|</span>}
                {stage.tools.map(t => <ToolBadge key={t.name} tool={t} />)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
            {PIPELINE_STAGES.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= selectedStage ? "linear-gradient(90deg, #ea580c, #fb923c)" : "rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        </div>
 
        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {/* FAQ Concept Cards */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#fb923c", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>📚 개념 이해 (Q&A)</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={openAll} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 11, padding: "3px 10px", borderRadius: 5, cursor: "pointer" }}>모두 펼치기</button>
                <button onClick={closeAll} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280", fontSize: 11, padding: "3px 10px", borderRadius: 5, cursor: "pointer" }}>모두 접기</button>
              </div>
            </div>
            {stage.conceptDepth.map((item, i) => (
              <FAQCard key={i} item={item} isOpen={!!openFAQs[i]} onToggle={() => toggleFAQ(i)} />
            ))}
          </div>
 
          {/* Params */}
          {stage.keyParams.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>⚙️ 파라미터 설정</div>
              {stage.keyParams.map(p => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600 }}>{p.label}</div>
                    <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{p.desc}</div>
                  </div>
                  <input type="text" value={params[p.name] ?? p.default}
                    onChange={e => setParams({ ...params, [p.name]: e.target.value })}
                    style={{ width: 130, padding: "6px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fb923c", fontSize: 14, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", outline: "none" }}
                  />
                </div>
              ))}
            </div>
          )}
 
          {/* Generate */}
          <button onClick={generateGuide} disabled={loading} style={{
            width: "100%", padding: "14px", borderRadius: 12,
            background: loading ? "rgba(251,146,60,0.1)" : "linear-gradient(135deg, #ea580c, #f97316)",
            border: "none", color: loading ? "#fb923c" : "#fff",
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginBottom: 20
          }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #fb923c", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                초보자 맞춤 가이드 생성 중...
              </span>
            ) : "🧬 초보자를 위한 상세 가이드 생성"}
          </button>
 
          {/* AI Response */}
          {aiResponse && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 600, marginBottom: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>🤖 AI 가이드</div>
              <MarkdownRenderer text={aiResponse} />
            </div>
          )}
 
          {/* Follow-up */}
          {aiResponse && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 12, letterSpacing: "0.04em" }}>💬 더 궁금한 거 물어보기</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {quickQs.map((q, i) => (
                  <button key={i} onClick={() => setCustomQ(q)} style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)", color: "#fb923c", fontSize: 12, padding: "6px 12px", borderRadius: 20, cursor: "pointer" }}>{q}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={customQ} onChange={e => setCustomQ(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && askFollowUp()}
                  placeholder="아무거나 물어보세요! 바보 같은 질문은 없어요 😊"
                  style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#e5e7eb", fontSize: 13, outline: "none", fontFamily: "'Pretendard', sans-serif" }}
                />
                <button onClick={askFollowUp} disabled={loading || !customQ.trim()} style={{
                  padding: "10px 18px", background: customQ.trim() ? "#ea580c" : "rgba(255,255,255,0.03)",
                  border: "none", borderRadius: 10, color: customQ.trim() ? "#fff" : "#4b5563",
                  fontSize: 13, fontWeight: 600, cursor: customQ.trim() ? "pointer" : "not-allowed"
                }}>전송</button>
              </div>
            </div>
          )}
 
          {/* Interpretation */}
          <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 600, marginBottom: 6 }}>✅ 이 단계의 핵심 체크포인트</div>
            <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7, margin: 0 }}>{stage.interpretation}</p>
          </div>
 
          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 30 }}>
            <button onClick={() => selectedStage > 0 && setSelectedStage(selectedStage - 1)} disabled={selectedStage === 0} style={{
              padding: "10px 20px", borderRadius: 10, fontSize: 13,
              background: selectedStage > 0 ? "rgba(255,255,255,0.04)" : "transparent",
              border: selectedStage > 0 ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
              color: selectedStage > 0 ? "#9ca3af" : "#1f2937",
              cursor: selectedStage > 0 ? "pointer" : "default"
            }}>← 이전 단계</button>
            <button onClick={() => selectedStage < PIPELINE_STAGES.length - 1 && setSelectedStage(selectedStage + 1)} disabled={selectedStage === PIPELINE_STAGES.length - 1} style={{
              padding: "10px 20px", borderRadius: 10, fontSize: 13,
              background: selectedStage < PIPELINE_STAGES.length - 1 ? "rgba(251,146,60,0.08)" : "transparent",
              border: selectedStage < PIPELINE_STAGES.length - 1 ? "1px solid rgba(251,146,60,0.15)" : "1px solid transparent",
              color: selectedStage < PIPELINE_STAGES.length - 1 ? "#fb923c" : "#1f2937",
              cursor: selectedStage < PIPELINE_STAGES.length - 1 ? "pointer" : "default"
            }}>다음 단계 →</button>
          </div>
        </div>
      </div>
 
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
        input:focus { border-color: rgba(251,146,60,0.3) !important; }
      `}</style>
    </div>
  );
}
 
