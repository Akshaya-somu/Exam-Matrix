import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Clock, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Question {
  questionText: string;
  questionType:
    | "multiple_choice"
    | "short_answer"
    | "essay"
    | "coding"
    | "true_false";
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export default function Exams() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startAt: "",
    endAt: "",
    durationMinutes: "",
  });
  const [questions, setQuestions] = useState<Question[]>([
    { questionText: "", questionType: "essay", points: 10 },
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: () => apiRequest("/api/exams"),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create exam first
      const exam = await apiRequest("/api/exams", {
        method: "POST",
        body: JSON.stringify(data.examData),
      });

      // Create questions for the exam
      if (data.questions && data.questions.length > 0) {
        for (let i = 0; i < data.questions.length; i++) {
          const question = data.questions[i];
          await apiRequest("/api/questions", {
            method: "POST",
            body: JSON.stringify({
              examId: exam._id,
              ...question,
              order: i + 1,
            }),
          });
        }
      }

      return exam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setIsOpen(false);
      setFormData({ name: "", startAt: "", endAt: "", durationMinutes: "" });
      setQuestions([{ questionText: "", questionType: "essay", points: 10 }]);
      toast({ title: "Exam and questions created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validQuestions = questions.filter(
      (q) => q.questionText.trim() !== ""
    );
    if (validQuestions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question",
        variant: "destructive",
      });
      return;
    }

    // Determine exam status based on start time
    const now = new Date();
    const startTime = new Date(formData.startAt);
    const endTime = new Date(formData.endAt);

    let status = "upcoming";
    if (now >= startTime && now <= endTime) {
      status = "live";
    } else if (now > endTime) {
      status = "completed";
    }

    createMutation.mutate({
      examData: {
        ...formData,
        durationMinutes: parseInt(formData.durationMinutes),
        status,
      },
      questions: validQuestions,
    });
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", questionType: "essay", points: 10 },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exams</h1>
            <p className="text-gray-600 mt-1">
              Manage exam schedules and questions
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Exam with Questions</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Exam Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Exam Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name">Exam Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Mathematics Final Exam"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startAt">Start Date & Time</Label>
                      <Input
                        id="startAt"
                        type="datetime-local"
                        value={formData.startAt}
                        onChange={(e) =>
                          setFormData({ ...formData, startAt: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endAt">End Date & Time</Label>
                      <Input
                        id="endAt"
                        type="datetime-local"
                        value={formData.endAt}
                        onChange={(e) =>
                          setFormData({ ...formData, endAt: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationMinutes: e.target.value,
                        })
                      }
                      placeholder="120"
                      required
                    />
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Questions</h3>
                    <Button
                      type="button"
                      onClick={addQuestion}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Question
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              Question {index + 1}
                            </Label>
                            {questions.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeQuestion(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`question-${index}`}>
                              Question Text
                            </Label>
                            <Textarea
                              id={`question-${index}`}
                              value={question.questionText}
                              onChange={(e) =>
                                updateQuestion(
                                  index,
                                  "questionText",
                                  e.target.value
                                )
                              }
                              placeholder="Enter your question here..."
                              className="min-h-[80px]"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`type-${index}`}>
                                Question Type
                              </Label>
                              <Select
                                value={question.questionType}
                                onValueChange={(value) =>
                                  updateQuestion(index, "questionType", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="essay">Essay</SelectItem>
                                  <SelectItem value="short_answer">
                                    Short Answer
                                  </SelectItem>
                                  <SelectItem value="multiple_choice">
                                    Multiple Choice
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`points-${index}`}>Points</Label>
                              <Input
                                id={`points-${index}`}
                                type="number"
                                value={question.points}
                                onChange={(e) =>
                                  updateQuestion(
                                    index,
                                    "points",
                                    parseInt(e.target.value)
                                  )
                                }
                                min="1"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending
                    ? "Creating..."
                    : "Create Exam with Questions"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8">Loading...</div>
          ) : exams && exams.length > 0 ? (
            exams.map((exam: any) => (
              <Card key={exam._id} className="hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{exam.name}</h3>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        exam.status === "live"
                          ? "bg-green-100 text-green-700"
                          : exam.status === "upcoming"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {exam.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(exam.startAt).toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {exam.durationMinutes} minutes
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No exams found. Create your first exam with questions!
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
