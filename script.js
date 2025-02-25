class WordQuiz {
    constructor() {
        this.API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
        this.API_KEY = 'sk-eaktcedbchkqvhpjofetenqihlsubjugpmepypptuzrezbag';
        this.words = [];
        this.currentQuestion = null;
        this.score = 0;
        
        this.initEventListeners();
        this.loadDefaultWordlist();
    }

    initEventListeners() {
        document.getElementById('excelUpload').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('startQuiz').addEventListener('click', () => this.startQuiz());
        document.getElementById('nextQuestion').addEventListener('click', () => this.nextQuestion());
        document.querySelector('.answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkAnswer();
        });
    }

    async loadDefaultWordlist() {
        try {
            const response = await fetch('wordlist/default.xlsx');
            if (response.ok) {
                const blob = await response.blob();
                this.processExcel(blob);
            }
        } catch (error) {
            console.log('未找到默认单词表');
        }
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.toggleUploadUI(true);
        this.processExcel(file);
    }

    toggleUploadUI(loading) {
        const btn = document.querySelector('.upload-btn');
        const progressBar = document.querySelector('.progress-bar');
        btn.style.display = loading ? 'none' : 'block';
        progressBar.style.display = loading ? 'block' : 'none';
    }

    async processExcel(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            this.words = jsonData.map(row => ({ word: row[0] }));
            await this.processWords();
            this.saveEnhancedExcel();
            this.toggleUploadUI(false);
        };
        reader.readAsArrayBuffer(file);
    }

    async processWords() {
        const total = this.words.length;
        for (let i = 0; i < total; i++) {
            const details = await this.fetchWordDetails(this.words[i].word);
            this.words[i] = { ...this.words[i], ...details };
            this.updateProgress((i + 1) / total);
        }
    }

    updateProgress(percent) {
        document.querySelector('.progress').style.width = `${percent * 100}%`;
    }

    async fetchWordDetails(word) {
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek-ai/DeepSeek-V2.5",
                    messages: [{
                        role: "user",
                        content: `生成单词"${word}"的音标（国际音标）、中文翻译、例句。严格使用JSON格式响应：{"phonetic": "...", "partOfSpeech": "...","translation": "...", "example": "..."}`
                    }],
                    temperature: 0.7
                })
            });

            const data = await response.json();
            const content = data.choices[0].message.content;
            const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('API调用失败:', error);
            return { phonetic: '', translation: '', example: '' };
        }
    }

    saveEnhancedExcel() {
        const worksheet = XLSX.utils.json_to_sheet(this.words.map(word => ({
            "单词": word.word,
            "音标": word.phonetic,
            "词性": word.partOfSpeech,
            "中文解释": word.translation,
            "例句": word.example

        })));
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "单词表");
        XLSX.writeFile(workbook, `enhanced_words_${new Date().toISOString().slice(0,10)}.xlsx`);
    }

    startQuiz() {
        const count = parseInt(document.getElementById('wordCount').value);
        this.quizWords = this.getRandomWords(count);
        this.currentQuestionIndex = -1;
        this.score = 0;
        document.getElementById('score').textContent = '0';
        this.nextQuestion();
    }

    getRandomWords(count) {
        return [...this.words]
            .sort(() => Math.random() - 0.5)
            .slice(0, count)
            .map(word => ({
                ...word,
                answer: word.word.toLowerCase().trim()
            }));
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.quizWords.length) {
            this.showFinalResult();
            return;
        }

        const current = this.quizWords[this.currentQuestionIndex];
        document.querySelector('.phonetic').textContent = current.phonetic;
        document.querySelector('.translation').textContent = current.translation;
        document.querySelector('.answer-input').value = '';
        document.querySelector('.result-feedback').textContent = '';
        document.getElementById('nextQuestion').classList.add('hidden');
    }

    checkAnswer() {
        const input = document.querySelector('.answer-input').value.toLowerCase().trim();
        const correctAnswer = this.quizWords[this.currentQuestionIndex].answer;
        const feedbackEl = document.querySelector('.result-feedback');

        if (input === correctAnswer) {
            this.score++;
            document.getElementById('score').textContent = this.score;
            feedbackEl.textContent = '✓ 正确！';
            feedbackEl.style.color = 'green';
            setTimeout(() => this.nextQuestion(), 1000);
        } else {
            feedbackEl.innerHTML = `✗ 错误！正确答案：<strong>${correctAnswer}</strong>`;
            feedbackEl.style.color = 'red';
            document.getElementById('nextQuestion').classList.remove('hidden');
        }
    }

    showFinalResult() {
        document.querySelector('.quiz-area').innerHTML = `
            <div class="result-summary">
                <h2>测试完成！</h2>
                <p>最终得分：${this.score}/${this.quizWords.length}</p>
                <button onclick="location.reload()">重新开始</button>
            </div>
        `;
    }
}

// 初始化应用
new WordQuiz();
