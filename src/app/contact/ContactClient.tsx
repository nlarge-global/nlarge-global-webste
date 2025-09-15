"use client";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  queryType: z.string().min(1, "Please select a query type"),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(100, "Subject must be less than 100 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactClient() {
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
  });

  const queryTypes = [
    {
      value: "general",
      label: "General Inquiry",
      email: "info@nlargecorp.com",
    },
    {
      value: "support",
      label: "Technical Support",
      email: "support@nlargecorp.com",
    },
  ];

  const watchedValues = watch();

  const onSubmit = async (data: ContactFormData) => {
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        reset();
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } else {
        throw new Error(result.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      setSubmitStatus("error");
    }
  };

  return (
  <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-32 pb-10 sm:pb-20 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center mb-16"
          >
            <h1 className="font-serif text-3xl sm:text-5xl md:text-7xl mb-4 sm:mb-6 tracking-tight">
              Contact Us
            </h1>
            <div className="w-24 h-px bg-current mx-auto mb-8 opacity-60" />
            <p className=" text-base sm:text-lg md:text-xl opacity-70 max-w-2xl mx-auto leading-relaxed">
              Begin a conversation with our team. We're here to discuss your
              vision and explore how we can craft excellence together.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-10 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-20 items-start">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-12"
            >
              <div>
                <h2 className="font-serif text-2xl sm:text-4xl font-light mb-4 sm:mb-8">
                  Get in Touch
                </h2>
                <p className=" opacity-70 leading-relaxed text-base sm:text-lg mb-6 sm:mb-12">
                  Whether you're seeking innovative solutions, technical
                  support, or exploring partnership opportunities, our dedicated
                  team is ready to assist you with the utmost care and
                  professionalism.
                </p>
              </div>

              <div className="space-y-8">
                {queryTypes.map((type, index) => (
                  <motion.div
                    key={type.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    className="border-l border-current border-opacity-20 pl-4 sm:pl-8"
                  >
                    <h3 className=" font-medium mb-1 sm:mb-2 text-base sm:text-lg">{type.label}</h3>
                    <p className=" text-xs sm:text-sm opacity-60">{type.email}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
                {/* Name Field */}
                <div>
                  <div className="relative">
                    <motion.input
                      type="text"
                      {...register("name")}
                      className="w-full py-2 sm:py-3 bg-transparent border-0 border-b border-current border-opacity-20 text-base sm:text-lg placeholder-transparent focus:outline-none focus:border-opacity-60 transition-all duration-500 peer"
                      placeholder="Full Name"
                      id="name"
                    />
                    <motion.label
                      htmlFor="name"
                      className="absolute left-0 top-2 sm:top-4 text-base sm:text-lg opacity-60 transition-all duration-300 peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:sm:top-4 peer-placeholder-shown:sm:text-lg peer-focus:-top-6 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:opacity-80 peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs sm:peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:opacity-80"
                    >
                      Full Name
                    </motion.label>
                    <motion.div
                      className="absolute bottom-0 left-0 h-px bg-current origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: watchedValues.name ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: "100%" }}
                    />
                  </div>
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 sm:mt-2 text-xs sm:text-sm opacity-70 text-red-600"
                    >
                      {errors.name.message}
                    </motion.p>
                  )}
                </div>
                {/* Email Field */}
                <div>
                  <div className="relative">
                    <motion.input
                      type="email"
                      {...register("email")}
                      className="w-full py-2 sm:py-3 bg-transparent border-0 border-b border-current border-opacity-20 text-base sm:text-lg placeholder-transparent focus:outline-none focus:border-opacity-60 transition-all duration-500 peer"
                      placeholder="Email Address"
                      id="email"
                    />
                    <motion.label
                      htmlFor="email"
                      className="absolute left-0 top-2 sm:top-4 text-base sm:text-lg opacity-60 transition-all duration-300 peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:sm:top-4 peer-placeholder-shown:sm:text-lg peer-focus:-top-6 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:opacity-80 peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs sm:peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:opacity-80"
                    >
                      Email Address
                    </motion.label>
                    <motion.div
                      className="absolute bottom-0 left-0 h-px bg-current origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: watchedValues.email ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: "100%" }}
                    />
                  </div>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 sm:mt-2 text-xs sm:text-sm opacity-70  text-red-600"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>

                {/* Query Type Field */}
                <div>
                  <div className="relative">
                    <select
                      {...register("queryType")}
                      className="w-full py-2 sm:py-3 bg-transparent border-0 border-b border-current border-opacity-20 text-base sm:text-lg focus:outline-none focus:border-opacity-60 transition-all duration-500 appearance-none cursor-pointer"
                      id="queryType"
                    >
                      <option value="">Select Query Type</option>
                      {queryTypes.map((type) => (
                        <option
                          key={type.value}
                          value={type.value}
                          className=""
                        >
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <motion.div
                      className="absolute bottom-0 left-0 h-px bg-current origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: watchedValues.queryType ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: "100%" }}
                    />
                  </div>
                  {errors.queryType && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 sm:mt-2 text-xs sm:text-sm opacity-70  text-red-600"
                    >
                      {errors.queryType.message}
                    </motion.p>
                  )}
                </div>

                {/* Subject Field */}
                <div>
                  <div className="relative">
                    <motion.input
                      type="text"
                      {...register("subject")}
                      className="w-full py-2 sm:py-3 bg-transparent border-0 border-b border-current border-opacity-20 text-base sm:text-lg placeholder-transparent focus:outline-none focus:border-opacity-60 transition-all duration-500 peer"
                      placeholder="Subject"
                      id="subject"
                    />
                    <motion.label
                      htmlFor="subject"
                      className="absolute left-0 top-2 sm:top-4 text-base sm:text-lg opacity-60 transition-all duration-300 peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:sm:top-4 peer-placeholder-shown:sm:text-lg peer-focus:-top-6 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:opacity-80 peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs sm:peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:opacity-80"
                    >
                      Subject
                    </motion.label>
                    <motion.div
                      className="absolute bottom-0 left-0 h-px bg-current origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: watchedValues.subject ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: "100%" }}
                    />
                  </div>
                  {errors.subject && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 sm:mt-2 text-xs sm:text-sm opacity-70  text-red-600"
                    >
                      {errors.subject.message}
                    </motion.p>
                  )}
                </div>

                <div>
                  {/* Message Field */}
                  <div className="relative">
                    <motion.textarea
                      {...register("message")}
                      rows={2}
                      className="w-full py-2 sm:py-3 bg-transparent border-0 border-b border-current border-opacity-20 text-base sm:text-lg placeholder-transparent focus:outline-none focus:border-opacity-60 transition-all duration-500 resize-none peer"
                      placeholder="Message"
                      id="message"
                    />
                    <motion.label
                      htmlFor="message"
                      className="absolute left-0 top-2 sm:top-4 text-base sm:text-lg opacity-60 transition-all duration-300 peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:sm:top-4 peer-placeholder-shown:sm:text-lg peer-focus:-top-6 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:opacity-80 peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs sm:peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:opacity-80"
                    >
                      Message
                    </motion.label>
                    <motion.div
                      className="absolute bottom-0 left-0 h-px bg-current origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: watchedValues.message ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: "100%" }}
                    />
                  </div>
                  {errors.message && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 sm:mt-2 text-xs sm:text-sm opacity-70  text-red-600"
                    >
                      {errors.message.message}
                    </motion.p>
                  )}
                </div>

                {/* Status Messages */}
                {submitStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 border border-green-800 border-opacity-20 text-green-800"
                  >
                    <p className=" opacity-80">
                      Thank you for your message. We'll get back to you within
                      24 hours.
                    </p>
                  </motion.div>
                )}

                {submitStatus === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 border border-red-600 border-opacity-20 text-red-500"
                  >
                    <p className=" opacity-80">
                      Sorry, there was an error sending your message. Please try
                      again.
                    </p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className="w-full py-3 sm:py-4 px-4 sm:px-6 border border-current border-opacity-20 font-medium text-base sm:text-lg transition-all duration-200 hover:border-opacity-60 hover:bg-black focus:outline-none focus:border-opacity-60 disabled:opacity-50 disabled:cursor-not-allowed hover:text-white cursor-pointer "
                >
                  {isSubmitting ? "Sending Message..." : "Send Message"}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
