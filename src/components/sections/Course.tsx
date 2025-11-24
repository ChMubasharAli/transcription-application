import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Video, Users, Award, Clock, CheckCircle } from 'lucide-react';
const Course = () => {
  const courses = [{
    id: 1,
    title: "NAATI CCL Foundation Course",
    price: "$299",
    duration: "4 weeks",
    level: "Beginner",
    students: "1,200+",
    description: "Perfect for beginners starting their NAATI CCL journey",
    features: ["20+ video lessons", "Basic interpreting techniques", "Cultural awareness training", "Practice dialogues", "1-on-1 mentoring session"]
  }, {
    id: 2,
    title: "NAATI CCL Intensive Course",
    price: "$599",
    duration: "8 weeks",
    level: "Intermediate",
    students: "2,500+",
    description: "Comprehensive course for serious CCL candidates",
    features: ["50+ video lessons", "Advanced interpreting strategies", "Mock exams with feedback", "Expert instructor support", "Weekly live Q&A sessions", "Unlimited practice access"],
    popular: true
  }, {
    id: 3,
    title: "NAATI CCL Masterclass",
    price: "$999",
    duration: "12 weeks",
    level: "Advanced",
    students: "800+",
    description: "Complete mastery program with guaranteed results",
    features: ["100+ video lessons", "Personal study plan", "One-on-one coaching", "Exam day strategy", "Lifetime course access", "Money-back guarantee"]
  }];
  return <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4 py-[77px]">
            NAATI CCL <span className="text-primary">Courses</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Structured learning programs designed by NAATI experts. Choose the course that fits your level and timeline.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {courses.map(course => <Card key={course.id} className={`p-6 relative ${course.popular ? 'border-primary shadow-glow' : ''}`}>
              {course.popular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-card-foreground mb-2">{course.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{course.description}</p>
                  
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-primary">{course.price}</span>
                    <span className="text-muted-foreground">one-time</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1">
                    <Clock className="w-5 h-5 text-primary mx-auto" />
                    <div className="text-sm font-medium text-card-foreground">{course.duration}</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                  <div className="space-y-1">
                    <Users className="w-5 h-5 text-primary mx-auto" />
                    <div className="text-sm font-medium text-card-foreground">{course.students}</div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {course.features.map((feature, index) => <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>)}
                </div>

                <Button className={`w-full ${course.popular ? 'bg-gradient-primary hover:shadow-glow' : 'bg-secondary hover:bg-secondary/80'} transition-all duration-300`}>
                  Enroll Now
                </Button>
              </div>
            </Card>)}
        </div>

        {/* Why Choose Our Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Why Choose Our Courses?
            </h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Expert-Designed Curriculum</h3>
                  <p className="text-muted-foreground">Created by certified NAATI interpreters with 10+ years of experience.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Interactive Learning</h3>
                  <p className="text-muted-foreground">High-quality video lessons with interactive exercises and real-time feedback.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Proven Results</h3>
                  <p className="text-muted-foreground">95% of our students pass the NAATI CCL exam on their first attempt.</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="p-8 bg-gradient-secondary">
            <div className="text-center">
              <Award className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-4">
                Satisfaction Guarantee
              </h3>
              <p className="text-muted-foreground mb-6">
                We're so confident in our courses that we offer a 30-day money-back guarantee. 
                If you're not completely satisfied, get a full refund.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">30</div>
                  <div className="text-sm text-muted-foreground">Day Guarantee</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">95%</div>
                  <div className="text-sm text-muted-foreground">Pass Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">4.9</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>;
};
export default Course;