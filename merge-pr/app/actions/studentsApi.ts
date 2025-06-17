import { createClient } from '@/utils/supabase/server';
import { Student_data } from '@/types/types';

export async function insertStudent(student: Student_data) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('student_data')
    .insert([student])
    .select();
  if (error) throw error;
  return data;
}

export async function updateStudent(
  student_id: string,
  updates: Partial<Student_data>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('student_data')
    .update(updates)
    .eq('student_id', student_id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteStudent(student_id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('student_data')
    .delete()
    .eq('student_id', student_id)
    .select();
  if (error) throw error;
  return data;
}

export async function getAllStudents() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('student_data').select();
  if (error) throw error;
  return data;
}

export async function getStudentById(student_id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('student_data')
    .select()
    .eq('student_id', student_id)
    .single();
  if (error) throw error;
  return data;
}

// Get all students by division
export async function getStudentsBySem(sem: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('student_data')
    .select()
    .eq('sem', sem);
  if (error) throw error;
  return data;
}

// Get all students by division and sem
export async function getStudentsByDivisionAndSem(
  division: string,
  sem: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('student_data')
    .select()
    .eq('division', division)
    .eq('sem', sem);
  if (error) throw error;
  return data;
}

// Get all students by division, batch, and sem
export async function getStudentsByDivisionBatchAndSem(
  division: string,
  batch: string,
  sem: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('student_data')
    .select()
    .eq('division', division)
    .eq('batch', batch)
    .eq('sem', sem);
  if (error) throw error;
  return data;
}

export async function getStudentAttendanceAverage(student_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_attendance_average', {
    student_id,
  });

  if (error) throw error;

  return data ?? 0; // data is the average
}
