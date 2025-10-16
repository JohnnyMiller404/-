// static/test.js (最终稳定版 - 分页功能)

document.addEventListener('DOMContentLoaded', function() {
    // 题目数据... (为节省篇幅，省略)
    const questionsData = { "阳虚质": { id_prefix: "yangxu", questions: [ "您手脚发凉吗？", "您胃脘部、背部或腰膝部怕冷吗?", "您感到怕冷、衣服比别人穿得多吗?", "您比别人容易患感冒吗?", "您吃(喝)凉的东西会感到不舒服或者怕吃(喝)凉东西吗?", "您受凉或吃(喝)凉东西后，容易腹泻(拉肚子)吗?" ] }, "阴虚质": { id_prefix: "yinxu", questions: [ "您感到手脚心发热吗?", "您感觉身体、脸上发热吗?", "您皮肤或口唇干吗?", "您口唇的颜色比一般人红吗?", "您容易便秘或大便干燥吗?", "您面部两潮红或偏红吗?", "您感到眼睛干涩吗?" ] }, "气虚质": { id_prefix: "qixu", questions: [ "您容易疲乏吗?", "您容易气短(呼吸短促，接不上气)吗?", "您容易心慌吗?", "您容易头晕或站起时晕眩吗?", "您比别人容易患感冒吗?", "您喜欢安静、懒得说话吗?", "您说话声音无力吗?", "您活动量稍大就容易出虚汗吗?" ] }, "痰湿质": { id_prefix: "tanshi", questions: [ "您感到胸闷或腹部胀满吗?", "您感到身体沉重不轻松或不爽快吗?", "您腹部肥满松软吗?", "您有额部油脂分泌多的现象吗?", "您上眼睑比别人肿(轻微隆起的现象)吗?", "您嘴里有黏黏的感觉吗?", "您平时痰多，特别是咽喉部总感到有痰堵着吗?", "您舌苔厚腻或有舌苔厚厚的感觉吗?" ] }, "湿热质": { id_prefix: "shire", questions: [ "您面部或鼻部有油腻感或者油亮发光吗?", "您容易生痤疮或疮疖吗?", "您感到口苦或嘴里有异味吗?", "您大便黏滞不爽、有解不尽的感觉吗?", "您小便时尿道有发热感、尿色浓(深)吗?", { text: "您带下色黄(白带颜色发黄)吗?(限女性)", gender: "female" }, { text: "您的阴囊部位潮湿吗?(限男性)", gender: "male" } ] }, "血瘀质": { id_prefix: "xueyu", questions: [ "您的皮肤在不知不觉中会出现青紫瘀斑(皮下出血)吗?", "您两颧部有细微红丝吗?", "您身体上有哪里疼痛吗?", "您面色晦黯或容易出现褐斑吗?", "您容易有黑眼圈吗?", "您容易忘事(健忘)吗?", "您口唇颜色偏黯吗?" ] }, "特禀质": { id_prefix: "tebing", questions: [ "您没有感冒时也会打喷嚏吗?", "您没有感冒时也会鼻塞、流鼻涕吗?", "您有因季节变化、温度变化或异味等原因而咳喘的现象吗?", "您容易过敏(对药物、食物、气味、花粉或在季节交替、气候变化时)吗?", "您的皮肤容易起荨麻疹(风团、风疹块、风疙瘩)吗?", "您的皮肤因过敏出现过紫癜(紫红色瘀点、瘀斑)吗?", "您的皮肤一抓就红，并出现抓痕吗?" ] }, "气郁质": { id_prefix: "qiyu", questions: [ "您感到闷闷不乐吗?", "您容易精神紧张、焦虑不安吗?", "您多愁善感、感情脆弱吗?", "您容易感到害怕或受到惊吓吗?", "您胁肋部或乳房腹痛吗?", "您无缘无故叹气吗?", "您咽喉部有异物感，且吐之不出、咽之不下吗？" ] }, "平和质": { id_prefix: "pinghe", questions: [ "您精力充沛吗?", "您容易疲乏吗?*", "您说话声音无力吗?*", "您感到闷闷不乐吗?*", "您比一般人耐受不了寒冷(冬天的寒冷，夏天的冷空调、电扇)吗?*", "您能适应外界自然和社会环境的变化吗?", "您容易失眠吗?*", "您容易忘事(健忘)吗?*" ] } };
    const options = [ { text: "没有", value: 1 }, { text: "很少", value: 2 }, { text: "有时", value: 3 }, { text: "时常", value: 4 }, { text: "总是", value: 5 } ];

    const form = document.getElementById('constitutionTestForm');
    const paginationControls = document.querySelector('.pagination-controls');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBarFill = document.getElementById('progressBarFill');
    let submitButton; // 提交按钮将在最后创建

    // 动态生成所有题目，但先不显示
    for (const [title, data] of Object.entries(questionsData)) {
        const group = document.createElement('div');
        group.className = 'question-group';
        group.innerHTML = `<h3 class="group-title">${title}</h3>`;
        
        data.questions.forEach((q, index) => {
            const qId = `q_${data.id_prefix}_${index + 1}`;
            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block';
            let qText = (typeof q === 'object') ? q.text : q;
            if (typeof q === 'object') {
                questionBlock.dataset.gender = q.gender;
                questionBlock.classList.add('gender-question');
            }
            
            let optionsHtml = '';
            options.forEach(opt => {
                optionsHtml += ` <label class="radio-label"> <input type="radio" name="${qId}" value="${opt.value}"> <span>${opt.text}</span> </label> `;
            });
            questionBlock.innerHTML = `<p class="question-text">${qText}</p><div class="options-container">${optionsHtml}</div>`;
            group.appendChild(questionBlock);
        });
        form.appendChild(group);
    }

    // --- 分页核心逻辑 ---
    const pages = Array.from(document.querySelectorAll('.question-group'));
    let currentPageIndex = 0;

    function showPage(index) {
        pages.forEach((page, i) => {
            page.classList.toggle('active', i === index);
        });
        
        // 更新进度条
        progressBarFill.style.width = `${((index + 1) / pages.length) * 100}%`;
        
        // 更新按钮状态
        prevBtn.classList.toggle('hidden', index === 0);
        nextBtn.style.display = (index === pages.length - 1) ? 'none' : 'block';
        if(submitButton) submitButton.style.display = (index === pages.length - 1) ? 'block' : 'none';
    }

    function validateCurrentPage() {
        const currentPage = pages[currentPageIndex];
        const inputs = currentPage.querySelectorAll('input[type="radio"]');
        const questionsOnPage = new Set([...inputs].map(i => i.name));
        
        for (const name of questionsOnPage) {
            const checked = currentPage.querySelector(`input[name="${name}"]:checked`);
            if (!checked) {
                // 特殊处理性别题：只要其中一个回答了就行
                const block = currentPage.querySelector(`input[name="${name}"]`).closest('.question-block');
                if (block.classList.contains('gender-question')) {
                    const femaleAnswered = currentPage.querySelector('[data-gender="female"] input:checked');
                    const maleAnswered = currentPage.querySelector('[data-gender="male"] input:checked');
                    if (femaleAnswered || maleAnswered) continue;
                }
                alert('请回答本页的所有问题后再继续。');
                return false;
            }
        }
        return true;
    }

    nextBtn.addEventListener('click', () => {
        if (validateCurrentPage()) {
            currentPageIndex++;
            showPage(currentPageIndex);
        }
    });

    prevBtn.addEventListener('click', () => {
        currentPageIndex--;
        showPage(currentPageIndex);
    });

    // 创建并添加最终的提交按钮
    submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn-submit-test';
    submitButton.textContent = '提交并查看结果';
    submitButton.style.display = 'none'; // 默认隐藏
    paginationControls.appendChild(submitButton);

    // 高亮和性别题互斥逻辑
    form.addEventListener('change', function(e) {
        if (e.target.type !== 'radio' || !e.target.checked) return;
        const parentBlock = e.target.closest('.question-block');
        if (parentBlock.dataset.gender === 'female') {
            document.querySelectorAll('[data-gender="male"] input').forEach(r => r.checked = false);
        } else if (parentBlock.dataset.gender === 'male') {
            document.querySelectorAll('[data-gender="female"] input').forEach(r => r.checked = false);
        }
        form.querySelectorAll('.radio-label').forEach(lbl => lbl.classList.remove('selected'));
        form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            radio.closest('.radio-label').classList.add('selected');
        });
    });

    // 表单提交
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!validateCurrentPage()) return; // 最后再验证一次
        
        const answers = {};
        new FormData(form).forEach((value, key) => { answers[key] = value; });
        
        showResultModal('<div class="loader"></div><p style="text-align:center;">正在为您分析体质...</p>');
        
        try {
            const response = await fetch('/api/submit_test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(answers)
            });
            const data = await response.json();
            let resultHtml = `<div class="result-content"><h4>您的体质辨识结果为：</h4><ul class="result-list">${data.results.map(r => `<li>${r}</li>`).join('')}</ul><p class="result-tip">温馨提示：本测试结果仅供参考，调理身体请咨询专业中医师。</p></div>`;
            showResultModal(resultHtml);
        } catch (error) {
            console.error('提交失败:', error);
            showResultModal('<p>分析失败，请稍后重试。</p>');
        }
    });

    // 初始化：显示第一页
    showPage(0);
});

// 弹窗函数... (不变)
function showResultModal(content) {
    const modal = document.getElementById('resultModal');
    const modalBody = document.getElementById('resultBody');
    modalBody.innerHTML = content;
    modal.style.display = 'block';
}
function closeResultModal() {
    const modal = document.getElementById('resultModal');
    if(modal) modal.style.display = 'none';
}
window.addEventListener('click', function(e) {
    const modal = document.getElementById('resultModal');
    if (e.target === modal) {
        closeResultModal();
    }
});