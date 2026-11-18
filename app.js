"use strict";
    var LEVELS = {
      g1: { vi:"Tokutei Gino 1", jp:"特定技能1号", pass:130, total:200, totalQ:45, subjects:["eisei","chori","sekkyaku"], examSub:"45 câu · 70 phút · 200 điểm · Đỗ khi đạt ≥ 130 điểm (65%) · Đề có furigana" },
      g2: { vi:"Tokutei Gino 2", jp:"特定技能2号", pass:163, total:250, totalQ:55, subjects:["eisei","chori","sekkyaku","unei"], examSub:"55 câu · 70 phút · 250 điểm · Đỗ khi đạt ≥ 163 điểm (65%) · Đề không có furigana" }
    };
    var FOOD_LEVELS = {
      g1: { vi:"Tokutei Gino 1", jp:"特定技能1号", pass:98, total:150, totalQ:40, subjects:["fsh","frd"], examSub:"40 câu · 70 phút · 150 điểm · Đỗ khi đạt ≥ 98 điểm (65%) · Đề có furigana · Được dùng máy tính · Điều kiện kèm theo: JLPT N4 hoặc JFT-Basic A2 · Lệ phí thi 8.000 yên" },
      g2: { vi:"Tokutei Gino 2", jp:"特定技能2号", pass:130, total:200, totalQ:50, subjects:["f2kotei","f2eisei","frd","f2hin","f2sei","f2sha"], examSub:"50 câu · 70 phút · 200 điểm · Đỗ khi đạt ≥ 130 điểm (65%) · Đề không có furigana · 4 lựa chọn · Điều kiện: kinh nghiệm quản lý/hướng dẫn từ 2 năm + JLPT N3 trở lên · Lệ phí thi 15.000 yên" }
    };
    /* ---------- Ngành Xây dựng: phân ngành + format 2 phần của JAC ---------- */
    var CONS_SUBS = {
      doboku:   { vi:"Thổ mộc", jp:"土木", key:"kcd" },
      kenchiku: { vi:"Kiến trúc", jp:"建築", key:"kck" },
      lifeline: { vi:"Hạ tầng – Thiết bị", jp:"ライフライン・設備", key:"kcl" }
    };
    function consLevel(){
      var sub = CONS_SUBS[state.sub], lv = state.level;
      if (lv === "g1") return { vi:"Tokutei Gino 1", jp:"特定技能1号", twoPart:true, passPct:65, partMin:[60,40], partQ:[30,20], totalQ:50, subjects:["kc", sub.key],
        examSub:"50 câu · Thi 2 phần RIÊNG nối tiếp: Học thuật 30 câu / 60 phút, xong mới sang Thực kỹ 20 câu / 40 phút · Mỗi câu 1 điểm, tính % đúng từng phần · Đỗ khi TỪNG phần đạt ≥ 65% · Trộn câu Đúng/Sai (○×) và trắc nghiệm · Điều kiện kèm theo: JLPT N4 hoặc JFT-Basic A2" };
      return { vi:"Tokutei Gino 2", jp:"特定技能2号", twoPart:true, passPct:75, partMin:[60,40], partQ:[40,25], totalQ:65, subjects:["kcg2", sub.key],
        examSub:"65 câu · Thi 2 phần RIÊNG nối tiếp: Học thuật 40 câu / 60 phút, xong mới sang Thực kỹ 25 câu / 40 phút · Mỗi câu 1 điểm, toàn bộ 4 lựa chọn · Đỗ khi TỪNG phần đạt ≥ 75% · Điều kiện kèm theo: kinh nghiệm làm tổ trưởng (班長) — hướng dẫn nhiều công nhân và quản lý tiến độ công trình" };
    }
    function LV(){
      if (state.sector === "food") return FOOD_LEVELS[state.level];
      if (state.sector === "construction") return consLevel();
      return LEVELS[state.level];
    }
    function LECS(){
      if (state.sector === "food") return LECTURES_FOOD[state.level];
      if (state.sector === "construction") return LECTURES_CONS[state.sub][state.level];
      return LECTURES[state.level];
    }
    function EXS(){
      if (state.sector === "food") return EXAMS_FOOD[state.level];
      if (state.sector === "construction") return EXAMS_CONS[state.sub][state.level];
      return EXAMS[state.level];
    }
    function sectorVi(){
      var v = SECTORS[state.sector].vi;
      if (state.sector === "construction" && state.sub) v += " · " + CONS_SUBS[state.sub].vi;
      return v;
    }
    var state = { sector:null, sub:null, level:null, screen:"home", stack:[], lecture:null, exam:null, examIdx:-1, answers:[], marked:{}, submitted:false, timer:null, remain:0, examPart:0, pendingGo:null, reviewAll:false };

    function $(id){ return document.getElementById(id); }
    function show(name){
      var screens = ["home","sector","sub","soon","donate","level","lectures","lecture","exams","exam","admin-login","admin"];
      for (var i=0;i<screens.length;i++){ $("screen-"+screens[i]).classList.toggle("active", screens[i]===name); }
      state.screen = name;
      var fb = $("fixed-back");
      if (name==="home"){ fb.classList.add("is-hidden"); document.body.classList.remove("has-fixed-back"); }
      else { fb.classList.remove("is-hidden"); document.body.classList.add("has-fixed-back"); }
      window.scrollTo(0,0);
      trackScreen(name);
    }

    /* ---------- Thống kê truy cập (GoatCounter) ---------- */
    /* Bộ đếm nạp bất đồng bộ bằng thẻ script riêng (data-goatcounter-settings
       no_onload=true) nên trang tự gọi count() cho từng màn hình bằng đường
       dẫn ảo dễ đọc. Lỗi thống kê không bao giờ được ảnh hưởng việc học. */
    var GC_PENDING = [];
    function trackView(path, title){
      try {
        var item = { path: path, title: title || "" };
        if (window.goatcounter && window.goatcounter.count){
          window.goatcounter.count(item);
        } else {
          GC_PENDING.push(item);
          if (GC_PENDING.length === 1){
            var iv = setInterval(function(){
              if (window.goatcounter && window.goatcounter.count){
                clearInterval(iv);
                while (GC_PENDING.length){
                  try { window.goatcounter.count(GC_PENDING.shift()); } catch (e) {}
                }
              }
            }, 300);
            setTimeout(function(){ clearInterval(iv); }, 6000);
          }
        }
      } catch (e) {}
    }
    var SECTOR_SLUGS = { food: "thuc-pham", restaurant: "nha-hang", construction: "xay-dung" };
    var SECTOR_TITLES = { food: "Ngành Thực Phẩm", restaurant: "Ngành Nhà Hàng", construction: "Ngành Xây Dựng" };
    var SUB_SLUGS = { doboku: "tho-moc", kenchiku: "kien-truc", lifeline: "ha-tang-thiet-bi" };
    var SUB_TITLES = { doboku: "Thổ mộc", kenchiku: "Kiến trúc", lifeline: "Hạ tầng – Thiết bị" };
    function sectorBase(){
      var p = "/tokutei/" + (SECTOR_SLUGS[state.sector] || "");
      if (state.sector === "construction" && state.sub) p += "/" + SUB_SLUGS[state.sub];
      return p;
    }
    function sectorTitle(){
      var t = SECTOR_TITLES[state.sector] || "";
      if (state.sector === "construction" && state.sub) t += " · " + SUB_TITLES[state.sub];
      return t;
    }
    function trackScreen(name){
      if (name === "admin-login" || name === "admin") return;
      var path = null, title = "";
      var lv = state.level === "g2" ? "gino-2" : "gino-1";
      var lvT = state.level === "g2" ? "Gino 2" : "Gino 1";
      if (name === "home"){ path = "/tokutei/trang-chu"; title = "Tokutei · Trang chủ"; }
      else if (name === "sub"){ path = "/tokutei/xay-dung"; title = "Tokutei · Ngành Xây Dựng"; }
      else if (name === "sector" && state.sector){ path = sectorBase(); title = "Tokutei · " + sectorTitle(); }
      else if (name === "soon" && state.sector){ path = sectorBase(); title = "Tokutei · " + sectorTitle(); }
      else if (name === "level" && state.sector){ path = sectorBase() + "/" + lv; title = "Tokutei · " + sectorTitle() + " · " + lvT; }
      else if (name === "lectures" && state.sector){ path = sectorBase() + "/" + lv + "/bai-giang"; title = "Tokutei · " + sectorTitle() + " · " + lvT + " · Bài giảng"; }
      else if (name === "lecture" && state.sector && state.lecture){
        var arr = LECS(), n = 1;
        for (var i = 0; i < arr.length; i++){ if (arr[i] === state.lecture){ n = i + 1; break; } }
        path = sectorBase() + "/" + lv + "/bai-giang/" + n;
        title = "Tokutei · " + sectorTitle() + " · " + lvT + " · Bài giảng " + n;
      }
      else if (name === "exams" && state.sector){ path = sectorBase() + "/" + lv + "/thi-thu"; title = "Tokutei · " + sectorTitle() + " · " + lvT + " · Thi thử"; }
      else if (name === "exam" && state.sector){ path = sectorBase() + "/" + lv + "/de-" + (state.examIdx + 1); title = "Tokutei · " + sectorTitle() + " · " + lvT + " · Đề " + (state.examIdx + 1); }
      else if (name === "donate"){ path = "/tokutei/donate"; title = "Tokutei · Donate cho tác giả"; }
      if (path) trackView(path, title);
    }
    function go(name){ state.stack.push(state.screen); show(name); }
    function goBack(){
      stopTimer();
      var prev = state.stack.pop() || "home";
      show(prev);
    }
    function crumb(el, items){
      var html = "";
      for (var i=0;i<items.length;i++){
        if (i>0) html += '<span class="sep">›</span>';
        html += (i===items.length-1) ? "<b>"+items[i]+"</b>" : "<span>"+items[i]+"</span>";
      }
      el.innerHTML = html;
    }
    function stopTimer(){ if (state.timer){ clearInterval(state.timer); state.timer = null; } }
    function fmtTime(s){ var m = Math.floor(s/60), ss = s%60; return (m<10?"0":"")+m+":"+(ss<10?"0":"")+ss; }

    /* ---------- Trang chủ → chọn ngành → chọn cấp độ ---------- */
    var SECTORS = {
      food: { vi:"Ngành Thực Phẩm", jp:"飲食料品製造業", sub1:"Tokutei Gino 1 · 40 câu · 150 điểm · Đỗ ≥ 98 điểm", sub2:"Tokutei Gino 2 · 50 câu · 200 điểm · Đỗ ≥ 130 điểm" },
      restaurant: { vi:"Ngành Nhà Hàng", jp:"外食業", sub1:"Tokutei Gino 1 · 45 câu · 200 điểm · Đỗ ≥ 130 điểm", sub2:"Tokutei Gino 2 · 55 câu · 250 điểm · Đỗ ≥ 163 điểm" },
      construction: { vi:"Ngành Xây Dựng", jp:"建設業", sub1:"Tokutei Gino 1", sub2:"Tokutei Gino 2" }
    };
    var sectorBtns = document.querySelectorAll("[data-sector]");
    for (var sb=0; sb<sectorBtns.length; sb++){
      sectorBtns[sb].addEventListener("click", function(){
        openSector(this.getAttribute("data-sector"));
      });
    }
    function openSector(key){
      state.sector = key;
      if (key === "construction"){
        state.sub = null;
        crumb($("crumb-sub"), ["Trang chủ", "Ngành Xây Dựng", "Chọn phân ngành"]);
        go("sub");
        return;
      }
      var S = SECTORS[key];
      crumb($("crumb-sector"), ["Trang chủ", S.vi]);
      var small = "TOKUTEI GINO — " + S.vi + " · " + S.jp;
      $("sector-small-1").textContent = small;
      $("sector-small-2").textContent = small;
      $("sector-g1-sub").textContent = S.sub1;
      $("sector-g2-sub").textContent = S.sub2;
      $("sector-back").textContent = "← Về trang chủ";
      go("sector");
    }
    var subBtns = document.querySelectorAll("[data-sub]");
    for (var ub=0; ub<subBtns.length; ub++){
      subBtns[ub].addEventListener("click", function(){ chooseSub(this.getAttribute("data-sub")); });
    }
    function chooseSub(sub){
      state.sub = sub;
      var CS = CONS_SUBS[sub];
      crumb($("crumb-sector"), ["Trang chủ", "Ngành Xây Dựng", CS.vi + " · " + CS.jp, "Chọn cấp độ"]);
      var small = "TOKUTEI GINO — NGÀNH XÂY DỰNG · " + CS.vi + "（" + CS.jp + "）";
      $("sector-small-1").textContent = small;
      $("sector-small-2").textContent = small;
      $("sector-g1-sub").textContent = "Học thuật 30 câu + Thực kỹ 20 câu · 2 phần riêng · Đỗ từng phần ≥ 65%";
      $("sector-g2-sub").textContent = "Học thuật 40 câu + Thực kỹ 25 câu · 2 phần riêng · Đỗ từng phần ≥ 75%";
      $("sector-back").textContent = "← Quay lại chọn phân ngành";
      go("sector");
    }
    $("sector-g1").addEventListener("click", function(){ chooseLevel("g1"); });
    $("sector-g2").addEventListener("click", function(){ chooseLevel("g2"); });
    function chooseLevel(lv){
      if (state.sector === "restaurant" || state.sector === "food" || state.sector === "construction"){
        state.level = lv;
        renderLevel(); go("level");
      } else {
        var S = SECTORS[state.sector], L = LEVELS[lv];
        crumb($("crumb-soon"), ["Trang chủ", S.vi, L.vi + " · " + L.jp]);
        $("soon-text").textContent = "Bài giảng và đề thi thử " + L.vi + "（" + L.jp + "） " + S.vi + " đang được biên soạn và sẽ sớm ra mắt. Cảm ơn bạn đã ghé thăm — mời bạn quay lại sau nhé!";
        go("soon");
      }
    }
    function renderLevel(){
      var L = LV();
      crumb($("crumb-level"), ["Trang chủ", sectorVi(), L.vi+" · "+L.jp]);
      $("lec-count").innerHTML = LECS().length + " bài giảng<br />" + L.subjects.length + " môn thi";
      $("exam-count").innerHTML = EXS().length ? (EXS().length + " đề đầy đủ<br />" + L.totalQ + " câu / đề") : "Đang cập nhật<br />Mời học bài giảng trước";
      $("go-lectures").onclick = function(){ renderLectures(); go("lectures"); };
      $("go-exams").onclick = function(){ renderExams(); go("exams"); };
    }

    /* ---------- Danh sách bài giảng ---------- */
    function renderLectures(){
      var L = LV();
      crumb($("crumb-lectures"), ["Trang chủ", sectorVi(), L.jp, "Bài giảng"]);
      var html = "";
      var idx = 0;
      for (var s=0;s<L.subjects.length;s++){
        var sk = L.subjects[s], S = SUBJECTS[sk];
        html += '<div class="subj-head"><span class="subj-dot" style="background:'+S.color+'"></span><h3>'+S.vi+'</h3><span class="jp">'+S.jp+'</span></div><div class="lec-list">';
        for (var i=0;i<LECS().length;i++){
          var lec = LECS()[i];
          if (lec.subj!==sk) continue;
          idx++;
          html += '<button class="lec-btn" type="button" data-lec="'+i+'"><span class="lec-no">Bài '+idx+'</span><span class="lt">'+lec.title+'<span class="lj jp">'+lec.titleJp+'</span></span><span class="arrow">›</span></button>';
        }
        html += "</div>";
      }
      $("lecture-list").innerHTML = html;
      var btns = $("lecture-list").querySelectorAll(".lec-btn");
      for (var b=0;b<btns.length;b++){
        btns[b].addEventListener("click", function(){
          state.lecture = LECS()[parseInt(this.getAttribute("data-lec"),10)];
          renderLecture(); go("lecture");
        });
      }
    }

    /* ---------- Chi tiết bài giảng ---------- */
    function renderLecture(){
      var lec = state.lecture, L = LV(), S = SUBJECTS[lec.subj];
      crumb($("crumb-lecture"), ["Trang chủ", sectorVi(), L.jp, "Bài giảng", lec.title]);
      var html = '<div class="card lecture-head"><div class="lec-meta"><span class="lec-chip jp">'+S.jp+'</span><span class="lec-chip alt">'+S.vi+'</span><span class="lec-chip alt">'+L.vi+'</span></div>'
        + '<h2 class="lec-title">'+lec.title+'</h2><p class="lec-intro">'+lec.intro+'</p><div class="lec-toc">';
      for (var i=0;i<lec.points.length;i++){ html += '<button type="button" data-toc="'+i+'">'+(i+1)+'. <span class="jp">'+lec.points[i].h+'</span></button>'; }
      html += "</div></div>";
      for (var p=0;p<lec.points.length;p++){
        var pt = lec.points[p];
        html += '<div class="card point-card" id="lec-point-'+p+'"><div class="point-top"><span class="point-no">'+(p+1)+'</span><h3 class="point-pattern jp">'+pt.h+'</h3></div>'
          + '<p class="sec-h">KIẾN THỨC TRỌNG TÂM</p><div class="key-box jp">'+pt.key+'</div>'
          + '<p class="sec-h">GIẢI THÍCH CHI TIẾT</p><p class="explain-text">'+pt.vi+'</p>'
          + '<div class="ex-list"><p class="sec-h">"+(state.sector==="food"?"VÍ DỤ THỰC TẾ TRONG NHÀ MÁY":(state.sector==="construction"?"VÍ DỤ THỰC TẾ TẠI CÔNG TRƯỜNG":"VÍ DỤ THỰC TẾ TRONG NHÀ HÀNG"))+</p><div class="ex-item"><p class="ex-jp jp">'+pt.exJp+'</p><p class="ex-vi">'+pt.exVi+'</p></div></div>'
          + '<div class="note-box"><b>⚠ Lưu ý khi đi thi:</b> '+pt.note+'</div></div>';
      }
      html += '<div class="card summary-card"><h3>Tổng kết bài học</h3><ul class="summary-list">';
      for (var sm=0; sm<lec.summary.length; sm++){ html += '<li><span class="s-pat jp">'+lec.summary[sm][0]+'</span><span class="s-mean">'+lec.summary[sm][1]+'</span></li>'; }
      html += '</ul><button class="lecture-done-btn" type="button" id="lec-done">✓ Đã học xong — về danh sách bài giảng</button></div>';
      $("lecture-content").innerHTML = html;
      var tocs = $("lecture-content").querySelectorAll("[data-toc]");
      for (var t=0;t<tocs.length;t++){
        tocs[t].addEventListener("click", function(){
          var target = $("lec-point-"+this.getAttribute("data-toc"));
          if (target) target.scrollIntoView({ behavior:"smooth", block:"start" });
        });
      }
      $("lec-done").addEventListener("click", function(){ goBack(); });
    }

    /* ---------- Danh sách đề thi ---------- */
    function renderExams(){
      var L = LV();
      crumb($("crumb-exams"), ["Trang chủ", sectorVi(), L.jp, "Thi thử"]);
      $("exams-title").textContent = "Thi thử " + L.vi + " — " + L.jp;
      $("exams-sub").textContent = EXS().length ? (L.examSub + (L.twoPart ? ". Hết giờ từng phần hệ thống tự chuyển phần / tự nộp bài." : ". Hết giờ hệ thống tự nộp bài. Chấm điểm theo đúng trọng số OTAFF.")) : L.examSub;
      var html = "";
      if (!EXS().length){
        html = '<div class="soon-card" style="grid-column:1/-1"><div class="soon-ico" aria-hidden="true">📝</div><h3>Đề thi thử đang được cập nhật</h3><p>Phần thi thử của cấp này đang được biên soạn theo đúng format chính thức. Mời bạn học trước các bài giảng để nắm chắc kiến thức nhé!</p></div>';
      }
      for (var i=0;i<EXS().length;i++){
        var badge = L.twoPart ? ("Học thuật "+L.partQ[0]+" câu · Thực kỹ "+L.partQ[1]+" câu · Đỗ từng phần ≥ "+L.passPct+"%") : (L.totalQ+' câu · 70 phút · '+L.total+' điểm');
        html += '<button class="test-btn '+(state.level==="g1"?"tb-green":"tb-blue")+'" type="button" data-exam="'+i+'"><span class="t-name">'+EXS()[i].name+'</span><span class="t-badge">'+badge+'</span></button>';
      }
      $("exam-grid").innerHTML = html;
      var btns = $("exam-grid").querySelectorAll(".test-btn");
      for (var b=0;b<btns.length;b++){
        btns[b].addEventListener("click", function(){ startExam(parseInt(this.getAttribute("data-exam"),10)); go("exam"); });
      }
    }

    /* ---------- Phòng thi CBT ---------- */
    function partLabel(part){ return part==="gak" ? "学科試験" : "実技試験"; }
    function partLabelVi(part){ return part==="gak" ? "Phần lý thuyết" : "Phần thực hành"; }
    function typeLabel(t){ return t==="handan" ? "判断試験" : (t==="keikaku" ? "計画立案試験" : (t==="ox" ? "真偽法（○×）" : "")); }

    /* ---------- Phòng thi: hỗ trợ format 2 phần nối tiếp (Xây dựng — JAC) ---------- */
    function curPartIdxs(){
      var qs = state.exam.questions, out = [], L = LV();
      for (var i=0;i<qs.length;i++){
        if (state.reviewAll || !L.twoPart) out.push(i);
        else if (state.examPart===0 ? qs[i].part==="gak" : qs[i].part==="jitsu") out.push(i);
      }
      return out;
    }
    function dispNum(i){
      var L = LV();
      if (!L.twoPart) return i+1;
      var qs = state.exam.questions, n = 0;
      for (var k=0;k<=i;k++) if (qs[k].part===qs[i].part) n++;
      return n;
    }
    function renderPartBanner(note){
      var L = LV(), el = $("part-banner");
      if (!L.twoPart || state.submitted){ el.className = "part-banner"; el.innerHTML = ""; return; }
      var p = state.examPart;
      el.className = "part-banner show";
      el.innerHTML = (note ? note + "<br />" : "")
        + "<b>PHẦN " + (p+1) + "/2 — " + (p===0 ? "学科試験（Học thuật）" : "実技試験（Thực kỹ）") + ":</b> "
        + L.partQ[p] + " câu · " + L.partMin[p] + " phút · đồng hồ riêng cho phần này. "
        + (p===0 ? "Làm xong phần Học thuật mới được chuyển sang phần Thực kỹ và không quay lại được. " : "")
        + "Mỗi phần phải đạt ≥ " + L.passPct + "% mới tính đỗ.";
    }
    function updateSubmitLabel(){
      var L = LV();
      $("submit-btn").textContent = (L.twoPart && state.examPart===0 && !state.submitted) ? "Nộp phần Học thuật → Sang phần Thực kỹ" : "Nộp bài thi";
    }
    function startExam(idx){
      stopTimer();
      state.examIdx = idx;
      state.exam = EXS()[idx];
      state.answers = []; state.marked = {}; state.submitted = false;
      state.examPart = 0; state.reviewAll = false; state.pendingGo = null;
      for (var i=0;i<state.exam.questions.length;i++) state.answers.push(-1);
      var L = LV();
      state.remain = L.twoPart ? L.partMin[0]*60 : 70*60;
      crumb($("crumb-exam"), ["Trang chủ", sectorVi(), L.jp, "Thi thử", state.exam.name]);
      $("exam-title").textContent = L.vi + " · " + state.exam.name + "（" + L.jp + "）";
      $("result-banner").className = "result-banner"; $("result-banner").innerHTML = "";
      $("score-box").innerHTML = "";
      $("retry-btn").classList.remove("show");
      $("submit-btn").style.display = "block";
      updateSubmitLabel();
      renderPartBanner();
      renderQNav(); renderQuestions(); updateTimerChip();
      state.timer = setInterval(function(){
        state.remain--;
        if (state.remain<=0){ state.remain = 0; updateTimerChip(); onTimeUp(); return; }
        updateTimerChip();
      }, 1000);
    }
    function onTimeUp(){
      var L = LV();
      if (L.twoPart && state.examPart===0 && !state.submitted){ advancePart(true); }
      else { finishExam(true); }
    }
    function advancePart(auto){
      state.examPart = 1;
      var L = LV();
      state.remain = L.partMin[1]*60;
      renderPartBanner(auto ? "⏱ <b>Hết giờ phần Học thuật</b> — hệ thống đã tự chuyển sang phần Thực kỹ." : "✓ Đã nộp phần Học thuật — bắt đầu phần Thực kỹ.");
      updateSubmitLabel();
      renderQNav(); renderQuestions(); updateTimerChip();
      window.scrollTo(0,0);
    }
    function updateTimerChip(){
      var chip = $("timer-chip");
      chip.textContent = "⏱ " + fmtTime(state.remain);
      chip.classList.toggle("low", state.remain<=300 && !state.submitted);
    }
    function renderQNav(){
      var idxs = curPartIdxs(), html = "";
      for (var n=0;n<idxs.length;n++){
        var i = idxs[n], cls = "";
        if (state.answers[i]>=0) cls += " answered";
        if (state.marked[i]) cls += " marked";
        html += '<button type="button" class="'+cls.trim()+'" data-qnav="'+i+'" aria-label="Câu '+dispNum(i)+'">'+dispNum(i)+'</button>';
      }
      $("qnav").innerHTML = html;
      var btns = $("qnav").querySelectorAll("[data-qnav]");
      for (var b=0;b<btns.length;b++){
        btns[b].addEventListener("click", function(){
          var n = parseInt(this.getAttribute("data-qnav"),10);
          var target = $("qblock-"+n);
          if (target) target.scrollIntoView({ behavior:"smooth", block:"start" });
          var all = $("qnav").querySelectorAll("button");
          for (var k=0;k<all.length;k++) all[k].classList.remove("current");
          this.classList.add("current");
        });
      }
    }
    function renderQuestions(){
      var qs = state.exam.questions, idxs = curPartIdxs(), html = "", lastPart = "", lastSubj = "";
      for (var n=0;n<idxs.length;n++){
        var i = idxs[n], q = qs[i];
        if (q.part!==lastPart || q.subj!==lastSubj){
          lastPart = q.part; lastSubj = q.subj;
          var S = SUBJECTS[q.subj];
          html += '<div class="part-head"><span class="ph-jp jp">'+partLabel(q.part)+' · '+S.jp+'</span><span class="ph-vi">'+partLabelVi(q.part)+' · '+S.vi+'</span><span class="ph-pts">'+q.pts+' điểm/câu</span></div>';
        }
        html += '<div class="q-block" id="qblock-'+i+'"><div class="q-meta"><span class="q-num">'+dispNum(i)+'</span>'
          + '<span class="q-tag jp">'+SUBJECTS[q.subj].jp+'</span>'
          + (q.type ? '<span class="q-tag jp">'+typeLabel(q.type)+'</span>' : '')
          + '<span class="q-tag pts">'+q.pts+' điểm</span>'
          + '<button class="mark-btn'+(state.marked[i]?" on":"")+'" type="button" data-mark="'+i+'">'+(state.marked[i]?"★ Đã đánh dấu":"★ Đánh dấu")+'</button></div>';
        if (q.sit) html += '<div class="q-sit jp"><span class="sit-label">TÌNH HUỐNG</span>'+q.sit+'</div>';
        html += '<p class="q-text jp">'+q.q+'</p><div class="opts">';
        for (var o=0;o<q.opts.length;o++){
          html += '<button class="opt-btn'+(state.answers[i]===o?" selected":"")+'" type="button" data-q="'+i+'" data-o="'+o+'"><span class="opt-letter">'+(o+1)+'</span><span class="jp">'+q.opts[o]+'</span></button>';
        }
        html += '</div><div class="explain" id="explain-'+i+'"><b>Giải thích:</b> '+q.ex+'</div></div>';
      }
      $("question-list").innerHTML = html;
      var opts = $("question-list").querySelectorAll(".opt-btn");
      for (var b=0;b<opts.length;b++){
        opts[b].addEventListener("click", function(){
          if (state.submitted) return;
          var qi = parseInt(this.getAttribute("data-q"),10), oi = parseInt(this.getAttribute("data-o"),10);
          state.answers[qi] = oi;
          var siblings = $("question-list").querySelectorAll('[data-q="'+qi+'"]');
          for (var s=0;s<siblings.length;s++) siblings[s].classList.toggle("selected", parseInt(siblings[s].getAttribute("data-o"),10)===oi);
          renderQNav();
        });
      }
      var marks = $("question-list").querySelectorAll("[data-mark]");
      for (var m=0;m<marks.length;m++){
        marks[m].addEventListener("click", function(){
          var qi = parseInt(this.getAttribute("data-mark"),10);
          state.marked[qi] = !state.marked[qi];
          this.classList.toggle("on", !!state.marked[qi]);
          this.textContent = state.marked[qi] ? "★ Đã đánh dấu" : "★ Đánh dấu";
          renderQNav();
        });
      }
    }

    /* ---------- Nộp bài & chấm điểm ---------- */
    $("submit-btn").addEventListener("click", function(){
      if (state.submitted) return;
      var L = LV();
      var advancing = !!(L.twoPart && state.examPart===0);
      var idxs = curPartIdxs(), un = 0;
      for (var n=0;n<idxs.length;n++) if (state.answers[idxs[n]]<0) un++;
      if (un>0){
        state.pendingGo = advancing ? "advance" : "finish";
        $("modal-title").textContent = advancing ? "Còn câu chưa làm ở phần Học thuật!" : "Còn câu chưa làm!";
        $("modal-text").textContent = "Bạn còn " + un + " câu chưa trả lời" + (advancing ? " trong phần Học thuật. Sang phần Thực kỹ rồi sẽ KHÔNG quay lại phần này được nữa, các câu trống tính 0 điểm." : ". Nộp bài bây giờ thì các câu đó sẽ tính 0 điểm.") + " Bạn có chắc muốn tiếp tục không?";
        $("modal-go").textContent = advancing ? "Sang phần Thực kỹ" : "Nộp bài luôn";
        $("confirm-modal").classList.add("show");
      } else if (advancing) { advancePart(false); }
      else { finishExam(false); }
    });
    $("modal-keep").addEventListener("click", function(){ $("confirm-modal").classList.remove("show"); });
    $("modal-go").addEventListener("click", function(){
      $("confirm-modal").classList.remove("show");
      if (state.pendingGo==="advance") advancePart(false); else finishExam(false);
      state.pendingGo = null;
    });

    function finishExam(auto){
      if (state.submitted) return;
      state.submitted = true; stopTimer();
      var L = LV();
      if (L.twoPart){ state.reviewAll = true; renderQNav(); renderQuestions(); }
      var qs = state.exam.questions;
      var byPart = { gak:{got:0,max:0}, jitsu:{got:0,max:0} };
      var bySubj = {};
      for (var s=0;s<L.subjects.length;s++) bySubj[L.subjects[s]] = { got:0, max:0 };
      var total = 0, correctCount = 0;
      for (var i=0;i<qs.length;i++){
        var q = qs[i], ok = state.answers[i]===q.a;
        byPart[q.part].max += q.pts; bySubj[q.subj].max += q.pts;
        if (ok){ byPart[q.part].got += q.pts; bySubj[q.subj].got += q.pts; total += q.pts; correctCount++; }
        var blockOpts = $("question-list").querySelectorAll('[data-q="'+i+'"]');
        for (var o=0;o<blockOpts.length;o++){
          blockOpts[o].disabled = true;
          if (o===q.a) blockOpts[o].classList.add("correct");
          else if (o===state.answers[i]) blockOpts[o].classList.add("wrong");
        }
        $("explain-"+i).classList.add("show");
      }
      var banner = $("result-banner");
      if (L.twoPart){
        var gPct = Math.round(byPart.gak.got / byPart.gak.max * 1000) / 10;
        var jPct = Math.round(byPart.jitsu.got / byPart.jitsu.max * 1000) / 10;
        var gOk = gPct >= L.passPct, jOk = jPct >= L.passPct, pass2 = gOk && jOk;
        banner.className = "result-banner show " + (pass2 ? "good" : "low");
        banner.innerHTML = (auto ? "⏱ Hết giờ — bài đã được tự động nộp.<br />" : "")
          + (pass2 ? "🎉 KẾT QUẢ: ĐỖ（合格）" : "KẾT QUẢ: CHƯA ĐỖ（不合格）")
          + '<span class="big-score">Học thuật ' + gPct + '% · Thực kỹ ' + jPct + '%</span>'
          + '<span class="pct">Đúng ' + correctCount + '/' + qs.length + ' câu · Đỗ khi TỪNG phần đạt ≥ ' + L.passPct + '% (format JAC) · ' + (pass2 ? "Cả 2 phần đều đạt mốc đỗ." : "Chỉ cần 1 phần dưới mốc là chưa đỗ, kể cả phần còn lại đạt cao.") + '</span>';
        var html2 = '<table class="score-table" aria-label="Bảng điểm chi tiết"><tr><th>Phần thi</th><th class="num">Câu đúng</th><th class="num">% đạt</th><th class="num">Mốc đỗ</th><th>Kết quả</th></tr>';
        html2 += '<tr><td><span class="jp">学科試験</span> — Học thuật</td><td class="num">' + byPart.gak.got + '/' + byPart.gak.max + '</td><td class="num">' + gPct + '%</td><td class="num">≥ ' + L.passPct + '%</td><td>' + (gOk ? "✓ Đạt" : "✗ Chưa đạt") + '</td></tr>';
        html2 += '<tr><td><span class="jp">実技試験</span> — Thực kỹ</td><td class="num">' + byPart.jitsu.got + '/' + byPart.jitsu.max + '</td><td class="num">' + jPct + '%</td><td class="num">≥ ' + L.passPct + '%</td><td>' + (jOk ? "✓ Đạt" : "✗ Chưa đạt") + '</td></tr>';
        for (var s3=0;s3<L.subjects.length;s3++){
          var sk3 = L.subjects[s3];
          html2 += '<tr><td><span class="jp">' + SUBJECTS[sk3].jp + '</span> — ' + SUBJECTS[sk3].vi + '</td><td class="num">' + bySubj[sk3].got + '/' + bySubj[sk3].max + ' câu</td><td class="num" colspan="3"></td></tr>';
        }
        html2 += '<tr class="total"><td>TỔNG KẾT — ' + (pass2 ? "ĐỖ" : "CHƯA ĐỖ") + ' (phải đạt cả 2 phần)</td><td class="num">' + correctCount + '/' + qs.length + ' câu</td><td class="num" colspan="3"></td></tr></table>';
        $("score-box").innerHTML = html2;
      } else {
        var pass = total >= L.pass;
        banner.className = "result-banner show " + (pass ? "good" : "low");
        banner.innerHTML = (auto ? "⏱ Hết giờ — bài đã được tự động nộp.<br />" : "")
          + (pass ? "🎉 KẾT QUẢ: ĐỖ（合格）" : "KẾT QUẢ: CHƯA ĐỖ（不合格）")
          + '<span class="big-score">' + total + ' / ' + L.total + ' điểm</span>'
          + '<span class="pct">Đúng ' + correctCount + '/' + qs.length + ' câu · Mốc đỗ chính thức: ' + L.pass + ' điểm (65%) · ' + (pass ? "Bạn đã vượt mốc đỗ " + (total - L.pass) + " điểm." : "Bạn còn thiếu " + (L.pass - total) + " điểm nữa.") + '</span>';
        var html = '<table class="score-table" aria-label="Bảng điểm chi tiết"><tr><th>Hạng mục</th><th class="num">Điểm đạt</th><th class="num">Điểm tối đa</th></tr>';
        html += '<tr><td><span class="jp">学科試験</span> — Lý thuyết</td><td class="num">' + byPart.gak.got + '</td><td class="num">' + byPart.gak.max + '</td></tr>';
        html += '<tr><td><span class="jp">実技試験</span> — Thực hành</td><td class="num">' + byPart.jitsu.got + '</td><td class="num">' + byPart.jitsu.max + '</td></tr>';
        for (var s2=0;s2<L.subjects.length;s2++){
          var sk = L.subjects[s2];
          html += '<tr><td><span class="jp">' + SUBJECTS[sk].jp + '</span> — ' + SUBJECTS[sk].vi + '</td><td class="num">' + bySubj[sk].got + '</td><td class="num">' + bySubj[sk].max + '</td></tr>';
        }
        html += '<tr class="total"><td>TỔNG CỘNG — ' + (pass ? "ĐỖ" : "CHƯA ĐỖ") + ' (mốc đỗ ' + L.pass + ' điểm)</td><td class="num">' + total + '</td><td class="num">' + L.total + '</td></tr></table>';
        $("score-box").innerHTML = html;
      }
      $("submit-btn").style.display = "none";
      $("retry-btn").classList.add("show");
      $("part-banner").className = "part-banner"; $("part-banner").innerHTML = "";
      updateTimerChip();
      window.scrollTo(0,0);
    }
    $("retry-btn").addEventListener("click", function(){ startExam(state.examIdx); });

    /* ---------- Donate cho tác giả (VietQR — Agribank) ---------- */
    /* Chuỗi payload VietQR tính sẵn kèm CRC chuẩn EMV cho từng mệnh giá — không sửa bất kỳ ký tự nào.
       Payload có đủ trường 59 (tên chủ tài khoản NGUYEN DUONG ANH, trường bắt buộc theo chuẩn EMVCo)
       để app ngân hàng nào cũng đọc ra màn hình chuyển khoản. Mã VietQR không có hạn sử dụng. */
    var DONATE_PAYLOADS = {
      "10000": "00020101021238570010A00000072701270006970405011327095555568680208QRIBFTTA53037045405100005802VN5916NGUYEN DUONG ANH62170813Cam on sensei6304B12A",
      "20000": "00020101021238570010A00000072701270006970405011327095555568680208QRIBFTTA53037045405200005802VN5916NGUYEN DUONG ANH62170813Cam on sensei63047363",
      "50000": "00020101021238570010A00000072701270006970405011327095555568680208QRIBFTTA53037045405500005802VN5916NGUYEN DUONG ANH62170813Cam on sensei6304A617"
    };
    var DONATE_LABELS = { "10000": "10.000\u20ab", "20000": "20.000\u20ab", "50000": "50.000\u20ab" };
    var DONATE_ACCOUNT = "2709555556868";

    function selectDonateAmount(amount){
      var btns = document.querySelectorAll(".amount-btn");
      for (var i=0;i<btns.length;i++){ btns[i].classList.toggle("selected", btns[i].getAttribute("data-amount") === amount); }
      var qr = qrcode(0, "M");
      qr.addData(DONATE_PAYLOADS[amount], "Byte");
      qr.make();
      /* margin 32px với cellSize 8 = vùng trắng yên lặng đúng chuẩn 4 module quanh mã,
         để camera app ngân hàng bắt được mã ngay cả khi quét qua màn hình. */
      $("donate-qr").innerHTML = qr.createSvgTag({ cellSize: 8, margin: 32, scalable: true });
      $("donate-amount-text").textContent = DONATE_LABELS[amount];
      $("copy-ok").textContent = "";
      $("donate-result").classList.add("show");
    }
    function copyAccountNumber(){
      var ok = $("copy-ok");
      function done(){ ok.textContent = "\u2713 \u0110\u00e3 sao ch\u00e9p s\u1ed1 t\u00e0i kho\u1ea3n " + DONATE_ACCOUNT; }
      function fallback(){
        var ta = document.createElement("textarea");
        ta.value = DONATE_ACCOUNT;
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); }
        catch (e) { ok.textContent = "H\u00e3y nh\u1eadp tay s\u1ed1 t\u00e0i kho\u1ea3n: " + DONATE_ACCOUNT; }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(DONATE_ACCOUNT).then(done, fallback);
      } else { fallback(); }
    }
    var amountBtns = document.querySelectorAll(".amount-btn");
    for (var ab=0; ab<amountBtns.length; ab++){
      amountBtns[ab].addEventListener("click", function(){ selectDonateAmount(this.getAttribute("data-amount")); });
    }
    $("copy-acc-btn").addEventListener("click", copyAccountNumber);
    $("go-donate").addEventListener("click", function(){ go("donate"); });

    /* ---------- Quản trị (khu vực của tác giả) ---------- */
    /* Cổng khoá nhẹ: chỉ lưu mã băm SHA-256 của mã khoá. Mã ban đầu là 123456;
       mã mới đặt trong mục Quản trị được lưu ở localStorage (khoá quantri-hash-v1)
       của chính trình duyệt này và được ưu tiên hơn mã ban đầu. */
    var ADMIN_BUILTIN_HASH = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";
    function adminHash(text){
      var enc = new TextEncoder().encode(text);
      return crypto.subtle.digest("SHA-256", enc).then(function(buf){
        return Array.prototype.map.call(new Uint8Array(buf), function(b){ return ("0" + b.toString(16)).slice(-2); }).join("");
      });
    }
    function adminExpectedHash(){
      try { return localStorage.getItem("quantri-hash-v1") || ADMIN_BUILTIN_HASH; }
      catch (e) { return ADMIN_BUILTIN_HASH; }
    }
    function adminUnlocked(){
      try { return sessionStorage.getItem("quantri-ok") === "1"; } catch (e) { return false; }
    }
    function openAdmin(){
      if (adminUnlocked()){ show("admin"); loadAdminTotal(); }
      else { go("admin-login"); }
    }
    function loadAdminTotal(){
      var el = $("admin-total");
      var note = $("admin-total-note");
      if (!el) return;
      el.textContent = "…";
      note.textContent = "Đang tải số liệu từ GoatCounter…";
      fetch("https://duonggiangiao-tokute.goatcounter.com/counter/TOTAL.json")
        .then(function(r){ if (!r.ok) throw new Error("http"); return r.json(); })
        .then(function(d){
          var n = d ? (d.total != null ? d.total : (d.count != null ? d.count : d.count_unique)) : null;
          if (n == null) throw new Error("empty");
          el.textContent = Number(n).toLocaleString("vi-VN");
          note.textContent = "Tổng lượt xem trang ghi nhận từ khi gắn bộ đếm — bản web này và bản GitHub Pages dùng chung một bộ đếm GoatCounter.";
        })
        .catch(function(){
          el.textContent = "—";
          note.textContent = "Chưa đọc được số tổng từ GoatCounter. Số này sẽ hiện sau khi bạn bật công khai bộ đếm trong GoatCounter (xem hướng dẫn bên dưới).";
        });
    }
    $("admin-open").addEventListener("click", function(ev){
      ev.preventDefault();
      stopTimer();
      openAdmin();
    });
    $("admin-login-btn").addEventListener("click", function(){
      var err = $("admin-login-err");
      if (!(window.crypto && crypto.subtle && window.TextEncoder)){
        err.textContent = "Trình duyệt này không hỗ trợ kiểm tra mã khoá — mời mở trang bằng https rồi thử lại.";
        return;
      }
      adminHash($("admin-code").value || "").then(function(h){
        if (h === adminExpectedHash()){
          try { sessionStorage.setItem("quantri-ok", "1"); } catch (e) {}
          err.textContent = "";
          $("admin-code").value = "";
          show("admin");
          loadAdminTotal();
        } else {
          err.textContent = "Mã khoá chưa đúng — mời bạn thử lại.";
        }
      });
    });
    $("admin-code").addEventListener("keydown", function(ev){
      if (ev.key === "Enter"){ ev.preventDefault(); $("admin-login-btn").click(); }
    });
    $("admin-change-btn").addEventListener("click", function(){
      var msg = $("admin-change-msg");
      var n1 = $("admin-new-1").value || "", n2 = $("admin-new-2").value || "";
      if (n1.length < 4){ msg.textContent = "Mã khoá mới cần ít nhất 4 ký tự."; return; }
      if (n1 !== n2){ msg.textContent = "Hai ô mã khoá mới chưa khớp nhau."; return; }
      adminHash(n1).then(function(h){
        try { localStorage.setItem("quantri-hash-v1", h); } catch (e) {}
        $("admin-new-1").value = ""; $("admin-new-2").value = "";
        msg.textContent = "✓ Đã đổi mã khoá (mã mới chỉ lưu trên trình duyệt này).";
      });
    });

    /* ---------- Điều hướng chung ---------- */
    var backBtns = document.querySelectorAll("[data-back]");
    for (var bb=0; bb<backBtns.length; bb++){ backBtns[bb].addEventListener("click", function(){ goBack(); }); }
    $("fixed-back").addEventListener("click", function(){ goBack(); });

    /* Kiểm tra dữ liệu (chỉ ghi console) */
    (function validate(){
      ["g1","g2"].forEach(function(lv){
        EXAMS[lv].forEach(function(ex, ei){
          var sum = 0; ex.questions.forEach(function(q){ sum += q.pts; });
          if (ex.questions.length !== LEVELS[lv].totalQ || sum !== LEVELS[lv].total) console.warn("Exam data mismatch", lv, ei, ex.questions.length, sum);
        });
      });
      EXAMS_FOOD.g1.forEach(function(ex, ei){
        var sum = 0; ex.questions.forEach(function(q){ sum += q.pts; });
        if (ex.questions.length !== FOOD_LEVELS.g1.totalQ || sum !== FOOD_LEVELS.g1.total) console.warn("Food exam data mismatch", ei, ex.questions.length, sum);
      });
      EXAMS_FOOD.g2.forEach(function(ex, ei){
        var sum = 0; ex.questions.forEach(function(q){ sum += q.pts; });
        if (ex.questions.length !== FOOD_LEVELS.g2.totalQ || sum !== FOOD_LEVELS.g2.total) console.warn("Food G2 exam data mismatch", ei, ex.questions.length, sum);
      });
      EXAMS_CONS.kenchiku.g1.forEach(function(ex, ei){
        var g = 0, j = 0; ex.questions.forEach(function(q){ if (q.part==="gak") g++; else j++; });
        if (g !== 30 || j !== 20) console.warn("Cons kenchiku G1 exam data mismatch", ei, g, j);
      });
      EXAMS_CONS.kenchiku.g2.forEach(function(ex, ei){
        var g = 0, j = 0; ex.questions.forEach(function(q){ if (q.part==="gak") g++; else j++; });
        if (g !== 40 || j !== 25) console.warn("Cons kenchiku G2 exam data mismatch", ei, g, j);
      });
      EXAMS_CONS.doboku.g1.forEach(function(ex, ei){
        var g = 0, j = 0; ex.questions.forEach(function(q){ if (q.part==="gak") g++; else j++; });
        if (g !== 30 || j !== 20) console.warn("Cons doboku G1 exam data mismatch", ei, g, j);
      });
      EXAMS_CONS.doboku.g2.forEach(function(ex, ei){
        var g = 0, j = 0; ex.questions.forEach(function(q){ if (q.part==="gak") g++; else j++; });
        if (g !== 40 || j !== 25) console.warn("Cons doboku G2 exam data mismatch", ei, g, j);
      });
      EXAMS_CONS.lifeline.g1.forEach(function(ex, ei){
        var g = 0, j = 0; ex.questions.forEach(function(q){ if (q.part==="gak") g++; else j++; });
        if (g !== 30 || j !== 20) console.warn("Cons lifeline G1 exam data mismatch", ei, g, j);
      });
      EXAMS_CONS.lifeline.g2.forEach(function(ex, ei){
        var g = 0, j = 0; ex.questions.forEach(function(q){ if (q.part==="gak") g++; else j++; });
        if (g !== 40 || j !== 25) console.warn("Cons lifeline G2 exam data mismatch", ei, g, j);
      });
    })();
    

    /* Đếm lượt mở trang chủ ngay khi tải trang */
    trackScreen("home");
