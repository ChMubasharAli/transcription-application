import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from 'lucide-react';
const Contact = () => {
  return <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4 py-[77px]">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Have questions about NAATI CCL preparation? Our expert team is here to help you succeed. 
            Reach out for personalized guidance and support.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-card-foreground mb-6">Send us a Message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    First Name
                  </label>
                  <Input placeholder="Enter your first name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Last Name
                  </label>
                  <Input placeholder="Enter your last name" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Email Address
                </label>
                <Input type="email" placeholder="Enter your email" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Phone Number
                </label>
                <Input type="tel" placeholder="Enter your phone number" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Subject
                </label>
                <Input placeholder="What can we help you with?" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Message
                </label>
                <Textarea placeholder="Tell us more about your questions or needs..." rows={5} />
              </div>
              
              <Button className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-card-foreground">Office Address</p>
                    <p className="text-muted-foreground">Level 5, 123 Collins Street<br />Melbourne VIC 3000, Australia</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Phone className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-card-foreground">Phone Number</p>
                    <p className="text-muted-foreground">+61 3 9000 0000</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Mail className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-card-foreground">Email Address</p>
                    <p className="text-muted-foreground">support@prepsmart.au</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-card-foreground">Business Hours</p>
                    <p className="text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM<br />Saturday: 10:00 AM - 4:00 PM</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-secondary">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Quick Support</h3>
              <p className="text-muted-foreground mb-6">
                Need immediate help? Our support team is available through multiple channels.
              </p>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Live Chat Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="w-4 h-4 mr-2" />
                  Schedule a Call
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Frequently Asked</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-card-foreground text-sm">How long does it take to prepare for NAATI CCL?</p>
                  <p className="text-muted-foreground text-sm mt-1">Most students prepare for 2-3 months with our structured courses.</p>
                </div>
                <div>
                  <p className="font-medium text-card-foreground text-sm">Do you offer refunds?</p>
                  <p className="text-muted-foreground text-sm mt-1">Yes, we offer a 30-day money-back guarantee on all courses.</p>
                </div>
                <div>
                  <p className="font-medium text-card-foreground text-sm">Can I get one-on-one coaching?</p>
                  <p className="text-muted-foreground text-sm mt-1">Yes, personalized coaching is available with our premium packages.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};
export default Contact;