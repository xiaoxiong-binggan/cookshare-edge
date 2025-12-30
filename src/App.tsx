import { useState } from 'react'
import './App.css'

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState('about')

  // 技能数据
  const skills = [
    { name: 'React', level: 85 },
    { name: 'TypeScript', level: 80 },
    { name: 'Git', level: 75 },
    { name: 'UI Design', level: 70 },
    { name: 'Node.js', level: 65 },
  ]

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {/* 导航栏 */}
      <nav className="navbar">
        <div className="logo">✨ Digital Portfolio</div>
        <div className="nav-links">
          <button onClick={() => setActiveTab('about')}>关于我</button>
          <button onClick={() => setActiveTab('skills')}>技能</button>
          <button onClick={() => setActiveTab('projects')}>项目</button>
          <button onClick={() => setActiveTab('contact')}>联系</button>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="main-content">
        {activeTab === 'about' && (
          <div className="card">
            <div className="avatar">👨‍💻</div>
            <h1>你好，我是开发者！</h1>
            <p>一名热爱前端技术的开发者，正在探索React和现代Web开发的无限可能。</p>
            <p>这是我的数字化名片，一个动态展示个人技能和项目的互动空间。</p>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="card">
            <h2>技术雷达</h2>
            <div className="skills-grid">
              {skills.map((skill, index) => (
                <div key={index} className="skill-item">
                  <div className="skill-header">
                    <span>{skill.name}</span>
                    <span>{skill.level}%</span>
                  </div>
                  <div className="skill-bar">
                    <div 
                      className="skill-progress" 
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="card">
            <h2>项目展示</h2>
            <div className="projects-grid">
              {[
                { title: '天气应用', desc: '实时天气查询工具', tech: 'React + API' },
                { title: '任务管理器', desc: '待办事项应用', tech: 'TypeScript' },
                { title: '电商界面', desc: '响应式商城UI', tech: 'CSS + React' },
              ].map((project, idx) => (
                <div key={idx} className="project-card">
                  <h3>{project.title}</h3>
                  <p>{project.desc}</p>
                  <span className="tech-tag">{project.tech}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="card">
            <h2>联系我</h2>
            <div className="contact-links">
              <a href="https://github.com/你的用户名" target="_blank">GitHub</a>
              <a href="mailto:你的邮箱@example.com">Email</a>
              <button onClick={() => alert('感谢关注！这是我的参赛作品')}>
                发送消息
              </button>
            </div>
            <p className="note">📌 这是天池大赛ESA Pages赛道的参赛作品</p>
          </div>
        )}
      </main>

      <footer>
        <p>© {new Date().getFullYear()} - 基于 Vite + React 构建 | ESA Pages 参赛作品</p>
      </footer>
    </div>
  )
}

export default App
