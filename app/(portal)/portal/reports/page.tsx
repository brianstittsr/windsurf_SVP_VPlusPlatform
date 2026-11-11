"use client";

import { useEffect, useMemo, useState } from "react";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import {
  listEnrollments,
  listCourses,
  listUsers,
  listExamAttempts,
  listInvoices,
} from "@/lib/lms";
import type {
  CourseDoc,
  EnrollmentDoc,
  ExamAttemptDoc,
  InvoiceDoc,
  TeamMemberDoc,
} from "@/lib/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { jsPDF } from "jspdf";
import { Download, FileText } from "lucide-react";

const COLORS = ["#8A6212", "#C9962B", "#D9AF52", "#8A6212", "#8A6212"];

export default function ReportsPage() {
  const { isLoading, isAuthenticated } = useRequireAuth([
    "instructor",
    "admin",
  ]);
  const [enrollments, setEnrollments] = useState<EnrollmentDoc[]>([]);
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [users, setUsers] = useState<TeamMemberDoc[]>([]);
  const [attempts, setAttempts] = useState<ExamAttemptDoc[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      const [en, co, us, at, inv] = await Promise.all([
        listEnrollments(),
        listCourses(false),
        listUsers(),
        listExamAttempts(),
        listInvoices(),
      ]);
      setEnrollments(en);
      setCourses(co);
      setUsers(us);
      setAttempts(at);
      setInvoices(inv);
      setLoading(false);
    };
    load();
  }, [isAuthenticated]);

  const courseMap = useMemo(
    () => new Map(courses.map((c) => [c.id, c])),
    [courses]
  );
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const stats = useMemo(() => {
    const perCourse = courses.map((c) => {
      const enrolled = enrollments.filter((e) => e.courseId === c.id);
      const done = enrolled.filter((e) => e.status === "completed").length;
      const avgProgress = enrolled.length
        ? Math.round(
            enrolled.reduce((s, e) => s + e.progressPercent, 0) /
              enrolled.length
          )
        : 0;
      return {
        name: c.code,
        enrollments: enrolled.length,
        completions: done,
        avgProgress,
      };
    });
    const passRate = attempts.length
      ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
      : 0;
    const revenue = invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.netCents, 0);
    const statusSplit = [
      {
        name: "Active",
        value: enrollments.filter((e) => e.status === "active").length,
      },
      {
        name: "Completed",
        value: enrollments.filter((e) => e.status === "completed").length,
      },
      {
        name: "Cancelled",
        value: enrollments.filter((e) => e.status === "cancelled").length,
      },
    ].filter((s) => s.value > 0);
    return { perCourse, passRate, revenue, statusSplit };
  }, [courses, enrollments, attempts, invoices]);

  const exportCsv = () => {
    const header =
      "Student,Email,Course,Status,Progress %,Enrolled,Last Accessed\n";
    const rows = enrollments
      .map((e) => {
        const u = userMap.get(e.studentId);
        const c = courseMap.get(e.courseId);
        return [
          `"${u ? `${u.firstName} ${u.lastName}` : e.studentId}"`,
          u?.emailPrimary || "",
          `"${c ? `${c.code} — ${c.title}` : e.courseId}"`,
          e.status,
          e.progressPercent,
          e.enrolledAt?.toDate().toISOString().slice(0, 10) || "",
          e.lastAccessedAt?.toDate().toISOString().slice(0, 10) || "",
        ].join(",");
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vplus-training-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("V+ Academy — Training Report", 14, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    let y = 36;
    doc.setFont("helvetica", "bold");
    doc.text("Course Performance", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    stats.perCourse.forEach((c) => {
      doc.text(
        `${c.name}: ${c.enrollments} enrolled · ${c.completions} completed · ${c.avgProgress}% avg progress`,
        14,
        y
      );
      y += 6;
    });
    y += 6;
    doc.text(`Exam pass rate: ${stats.passRate}%`, 14, y);
    y += 6;
    doc.text(`Revenue (paid invoices): $${(stats.revenue / 100).toFixed(2)}`, 14, y);
    doc.save(`vplus-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (isLoading || !isAuthenticated || loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Reports &amp; Analytics</h1>
          <p className="text-muted-foreground">
            Student performance, course effectiveness, and engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> CSV Export
          </Button>
          <Button variant="outline" onClick={exportPdf}>
            <FileText className="mr-2 h-4 w-4" /> PDF Report
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Total Enrollments", enrollments.length],
          ["Students", new Set(enrollments.map((e) => e.studentId)).size],
          ["Exam Pass Rate", `${stats.passRate}%`],
          ["Revenue", `$${(stats.revenue / 100).toFixed(2)}`],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrollments by course */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">
              Enrollments by Course
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.perCourse}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="enrollments" fill="#8A6212" name="Enrolled" />
                <Bar dataKey="completions" fill="#C9962B" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status split */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">
              Enrollment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusSplit}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {stats.statusSplit.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Avg progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">
              Average Progress by Course
            </CardTitle>
            <CardDescription>
              Mean completion percentage across enrolled students
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.perCourse} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar dataKey="avgProgress" fill="#8A6212" name="Avg %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
