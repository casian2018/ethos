import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-200/40 dark:bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-200/40 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          <div className="absolute -bottom-40 left-1/2 w-96 h-96 bg-purple-200/40 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          {/* Logo & Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Your Fitness Journey Starts Here
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600">
                ETHOS
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-300 max-w-3xl mx-auto leading-relaxed">
              Connect with fitness enthusiasts, track your workouts, and achieve your goals together. 
              Your personal fitness companion for a healthier lifestyle.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/dev/profile"
              className="group px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/25 transform hover:-translate-y-1"
            >
              <span className="flex items-center gap-2">
                Get Started Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="/dev/how_to"
              className="group px-8 py-4 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold rounded-2xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </span>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {[
              { icon: "💪", title: "Workout Tracking", desc: "Log exercises, track progress, and get personalized workout plans tailored to your goals." },
              { icon: "🤝", title: "Find a Buddy", desc: "Connect with like-minded fitness enthusiasts in your area and stay motivated together." },
              { icon: "🏆", title: "Competitions", desc: "Join challenges, compete with friends, and push your limits with community competitions." }
            ].map((feature, idx) => (
              <div key={idx} className="group bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-zinc-200/50 dark:border-zinc-700/50 hover:-translate-y-1">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { number: "10K+", label: "Active Users" },
              { number: "50K+", label: "Workouts Logged" },
              { number: "500+", label: "Monthly Challenges" },
              { number: "98%", label: "Satisfaction Rate" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  {stat.number}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Powerful tools to help you track, analyze, and improve your fitness journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "📊", title: "Advanced Stats", desc: "Track your progress with detailed analytics and insights." },
              { icon: "😴", title: "Sleep Analysis", desc: "Monitor sleep quality and optimize recovery for better performance." },
              { icon: "💬", title: "Community Forum", desc: "Get advice, share experiences, and learn from others." },
              { icon: "📖", title: "Expert Guides", desc: "Access workout guides and nutrition tips from professionals." },
              { icon: "🎯", title: "Goal Setting", desc: "Set personalized fitness goals and track your achievements." },
              { icon: "🔔", title: "Reminders", desc: "Stay on track with smart workout and nutrition reminders." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                <div className="text-3xl">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Fitness?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of fitness enthusiasts who have already started their journey with ETHOS.
          </p>
          <Link
            href="/dev/profile"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-semibold rounded-2xl text-lg hover:bg-emerald-50 transition-all duration-300 shadow-xl hover:shadow-2xl"
          >
            Start Your Journey
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2024 ETHOS. Your Fitness Journey.</p>
        </div>
      </footer>
    </div>
  );
}
