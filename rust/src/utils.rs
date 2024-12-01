use std::fmt::Display;
use std::fs::File;
use std::io::{self, BufRead, BufReader, Error, Lines};
use std::path::Path;
use std::sync::atomic::AtomicUsize;
use std::time::Instant;

#[macro_export]
macro_rules!
log {
    ($level:tt,$ctxt:expr,$msg:expr) => (
        $ctxt.$level(|| println!($msg))
    );
    ($level:tt, $ctxt:expr,$msg:expr, $($other:expr) ,*) => (
        $ctxt.$level(|| println!($msg,$($other , )+))
    );
}

#[macro_export]
macro_rules! check_result {
    ($ctxt:expr, [$res_p1:expr, $res_p2:expr ], [ $res_p1_test:expr,$res_p1_real:expr, $res_p2_test:expr, $res_p2_real:expr ] ) => {
        if $ctxt.is_bench() {
            return;
        }
        if $ctxt.has_part() {
            panic!("Shoudn't be call in separate run context")
        }
        if ($ctxt.is_test()) {
            $ctxt.check_both(($res_p1, $res_p2), ($res_p1_test, $res_p2_test))
        } else {
            $ctxt.check_both(($res_p1, $res_p2), ($res_p1_real, $res_p2_real))
        }
    };

    ($ctxt:expr, $res:expr, [ $res1:expr, $res2:expr ] ) => {
        if $ctxt.is_bench() {
            return;
        }

        if !$ctxt.has_part() {
            panic!("Shoudn't be call in mono run context")
        }
        if ($ctxt.is_test()) {
            $ctxt.check($res, $res1)
        } else {
            $ctxt.check($res, $res2)
        }
    };
}

fn read_lines_internal<P>(filename: P) -> Result<Lines<BufReader<File>>, Error>
where
    P: AsRef<Path>,
{
    let file = File::open(filename)?;
    Ok(io::BufReader::new(file).lines())
}

fn get_applicable_filename_default(day: &u8, is_test: &Dataset) -> String {
    return format!(
        "../data/day_{}{}.dat",
        day,
        match is_test {
            Dataset::Test => "_test",
            _ => "",
        }
    );
}

fn get_applicable_filename(day: &u8, part: Option<Part>, is_test: &Dataset) -> String {
    return part
        .map(|p| {
            format!(
                "../data/day_{}_{}{}.dat",
                day,
                match p {
                    Part::Part1 => 1,
                    Part::Part2 => 2,
                },
                match is_test {
                    Dataset::Test => "_test",
                    _ => "",
                }
            )
        })
        .filter(|name| std::path::Path::new(name.as_str()).exists())
        .unwrap_or_else(|| get_applicable_filename_default(day, is_test));
}

pub fn read_lines(day: &u8, part: Option<Part>, is_test: &Dataset) -> Option<Lines<BufReader<File>>> {
    let f = read_lines_internal(get_applicable_filename(day, part, is_test));

    return match f {
        Ok(lines) => Some(lines),
        Err(_) => {
            println!("No file found");
            None
        }
    };
}

#[derive(Eq, PartialEq, Clone, Copy)]
pub enum Mode {
    STANDARD,
    BENCH(u16),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Part {
    Part1,
    Part2,
}

#[derive(Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum LogLevel {
    ERROR = 0,
    INFO = 1,
    DEBUG = 2,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Dataset {
    Test,
    Real,
}

#[allow(dead_code)]
pub enum Active {
    True,
    False,
}

#[allow(dead_code)]
pub struct Context {
    log_level: LogLevel,
    day: u8,
    data_set: Dataset,
    is_debug: bool,
    is_bench: bool,
    part: Option<Part>,
}
static NB_FAILURES: AtomicUsize = AtomicUsize::new(0);

#[allow(dead_code)]
impl Context {
    fn new_part(day: &u8, options: &RunOption, part: Part, data_set: &Dataset) -> Context {
        return Context::new(day, options, Some(part), data_set);
    }

    fn new_all(day: &u8, options: &RunOption, data_set: &Dataset) -> Context {
        return Context::new(day, options, None, data_set);
    }

    fn new(day: &u8, options: &RunOption, part: Option<Part>, data_set: &Dataset) -> Context {
        let log_level = options.get_log_level();
        let is_debug = options.debug.unwrap_or(false);
        let is_bench = options
            .mode
            .map(|m| match m {
                Mode::BENCH(_) => true,
                _ => false,
            })
            .unwrap_or(false);
        return Context {
            log_level: log_level,
            day: *day,
            data_set: *data_set,
            part: part,
            is_debug: is_debug,
            is_bench: is_bench,
        };
    }

    fn log(&self, log_level: LogLevel, print_fct: impl Fn()) {
        if log_level <= self.log_level {
            match &self.part {
                Some(p) => {
                    print!("[Day {}/{:?}/{:?}]", self.day, p, self.data_set)
                }
                None => print!("[Day {}/ALL/{:?}]", self.day, self.data_set),
            }
            print_fct();
        }
    }

    #[allow(dead_code)]
    pub fn debug(&self, print_fct: impl Fn()) {
        self.log(LogLevel::DEBUG, print_fct);
    }

    pub fn error(&self, print_fct: impl Fn()) {
        self.log(LogLevel::ERROR, print_fct);
    }

    pub fn info(&self, print_fct: impl Fn()) {
        self.log(LogLevel::INFO, print_fct);
    }

    #[allow(dead_code)]
    pub fn is_debug(&self) -> bool {
        return self.is_debug;
    }

    pub fn is_part(&self, part: Part) -> bool {
        return if let Some(p) = self.part { p == part } else { false };
    }

    pub fn is_bench(&self) -> bool {
        self.is_bench
    }

    pub fn has_part(&self) -> bool {
        return match self.part {
            Some(_) => true,
            None => false,
        };
    }

    pub fn is_test(&self) -> bool {
        return self.data_set == Dataset::Test;
    }

    pub fn check<T: Eq + Display>(&self, val: T, expected: T) {
        if val == expected {
            log!(info, self, "Result OK {}", val);
        } else {
            Context::incr_error();
            log!(error, self, "Result KO >>>{}<<<< instead of {})", val, expected);
        }
    }

    fn incr_error() {
        NB_FAILURES.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    }

    pub fn get_errors() -> usize {
        NB_FAILURES.fetch_add(0, std::sync::atomic::Ordering::Relaxed)
    }

    pub fn check_both<T: Eq + Display>(&self, val: (T, T), expected: (T, T)) {
        if val.0 == expected.0 && val.1 == expected.1 {
            log!(info, self, "Result OK ({},{})", val.0, val.1);
        } else if val.0 != expected.0 && val.1 == expected.1 {
            Context::incr_error();
            log!(
                error,
                self,
                "Result KO (>>>{}<<<,>>>{}<<<) instead of {},{})",
                val.0,
                val.1,
                expected.0,
                expected.1
            );
        } else if val.0 != expected.0 {
            Context::incr_error();
            log!(
                error,
                self,
                "Result KO (>>>{}<<<,{}) instead of {},{})",
                val.0,
                val.1,
                expected.0,
                expected.1
            );
        } else if val.1 != expected.1 {
            Context::incr_error();
            log!(
                error,
                self,
                "Result KO ({},>>>{}<<<) instead of {},{})",
                val.0,
                val.1,
                expected.0,
                expected.1
            );
        }
    }
}

pub fn run<F: Fn(&Context, &Vec<String>)>(context: Context, fct: &F, mode: &Mode) {
    log!(info, &context, "Starting");

    let start_read = Instant::now();
    let lines = to_lines(&context.day, context.part, &context.data_set);
    let read_duration = start_read.elapsed().as_secs_f32() * 1000.0;
    let nb_max = match *mode {
        Mode::BENCH(nb) => nb,
        _ => 1,
    };
    let start = Instant::now();
    let mut count = 0;
    while count < nb_max {
        count += 1;
        fct(&context, &lines);
    }
    let duration = start.elapsed().as_secs_f32() * 1000.0;

    log!(
        info,
        context,
        "Duration {:.2} ms (avg {:.2} for #{} iterations) and {:.2} ms for read",
        duration,
        duration / nb_max as f32,
        count,
        read_duration
    );
}

#[allow(dead_code)]
pub fn run_simult<F: Fn(&Context, &Vec<String>)>(context: Context, fct: &F, mode: &Mode) {
    log!(info, context, "Starting");

    let start_read = Instant::now();
    let lines = to_lines(&context.day, None, &context.data_set);
    let read_duration = start_read.elapsed().as_secs_f32() * 1000.0;

    let nb_max = match *mode {
        Mode::BENCH(nb) => nb,
        _ => 1,
    };
    let start = Instant::now();
    let mut count = 0;
    while count < nb_max {
        count += 1;
        fct(&context, &lines);
    }
    let duration = start.elapsed().as_secs_f32() * 1000.0;
    log!(
        info,
        context,
        "Duration {:.2} ms (avg {:.2} for #{} iterations) and {:.2} ms for read",
        duration,
        duration / nb_max as f32,
        count,
        read_duration
    )
}

pub fn to_lines(day: &u8, part: Option<Part>, data_set: &Dataset) -> Vec<String> {
    return read_lines(day, part, data_set)
        .map(|lines| lines.map(|l| l.unwrap()).collect())
        .unwrap_or(vec![]);
}

pub type DaysRestriction<'a> = &'a Option<Vec<u8>>;
pub struct RunOption<'a> {
    active: Option<bool>,
    mode: Option<Mode>,
    debug: Option<bool>,
    part_restriction: Option<Part>,
    days_restriction: DaysRestriction<'a>,
}

impl<'a> RunOption<'a> {
    pub fn default(days_restriction: DaysRestriction<'a>) -> RunOption<'a> {
        RunOption::new(days_restriction)
    }
    pub fn new(days_restriction: DaysRestriction<'a>) -> RunOption<'a> {
        RunOption {
            debug: None,
            mode: None,
            active: None,
            part_restriction: None,
            days_restriction,
        }
    }

    #[allow(dead_code)]
    pub fn disabled() -> RunOption<'a> {
        RunOption {
            debug: None,
            mode: None,
            active: Some(false),
            part_restriction: None,
            days_restriction: &None,
        }
    }
    #[allow(dead_code)]
    pub fn debug(&self) -> RunOption<'a> {
        RunOption {
            debug: Some(true),
            mode: self.mode,
            active: self.active,
            part_restriction: self.part_restriction,
            days_restriction: self.days_restriction,
        }
    }

    #[allow(dead_code)]
    pub fn bench(&self, nb: u16) -> RunOption<'a> {
        RunOption {
            active: self.active,
            mode: Some(Mode::BENCH(nb)),
            debug: self.debug,
            part_restriction: self.part_restriction,
            days_restriction: self.days_restriction,
        }
    }

    #[allow(dead_code)]
    pub fn only(&self, part: Part) -> RunOption<'a> {
        RunOption {
            active: self.active,
            mode: self.mode,
            debug: self.debug,
            part_restriction: Some(part),
            days_restriction: self.days_restriction,
        }
    }

    fn is_active(&self, day: &u8) -> bool {
        if !self.active.unwrap_or(true) {
            return false;
        }

        if let Some(days_restricted) = self.days_restriction {
            if !days_restricted.contains(day) {
                return false;
            }
        }
        return true;
    }

    fn get_mode(&self) -> &Mode {
        self.mode.as_ref().unwrap_or(&Mode::STANDARD)
    }

    fn get_log_level(&self) -> LogLevel {
        if self.is_debug() {
            LogLevel::DEBUG
        } else {
            LogLevel::INFO
        }
    }

    fn is_debug(&self) -> bool {
        self.debug.unwrap_or(false)
    }

    fn is_part_enabled(&self, part: Part) -> bool {
        self.part_restriction.is_none() || self.part_restriction.unwrap() == part
    }
}

pub fn run_all<F: Fn(&Context, &Vec<String>)>(day: &u8, fct: &F, options: RunOption) {
    if !options.is_active(day) {
        return;
    }

    let mode = options.get_mode();

    println!("");
    println!("");
    println!("[Day {}] run per part", day);
    let start = Instant::now();
    if options.is_part_enabled(Part::Part1) {
        run(Context::new_part(day, &options, Part::Part1, &Dataset::Test), &fct, mode);
        println!("");
        run(Context::new_part(day, &options, Part::Part1, &Dataset::Real), &fct, mode);
        println!("");
    }
    if options.is_part_enabled(Part::Part2) {
        run(Context::new_part(day, &options, Part::Part2, &Dataset::Test), &fct, mode);
        println!("");
        run(Context::new_part(day, &options, Part::Part2, &Dataset::Real), &fct, mode);
        println!("");
    }
    let duration = start.elapsed().as_secs_f32() * 1000.0;

    println!("[Day {}] done in {:.2} ms", day, duration);
}

#[allow(dead_code)]
pub fn run_all_simult<F: Fn(&Context, &Vec<String>)>(day: &u8, fct: &F, options: RunOption) {
    if !options.is_active(day) {
        return;
    }
    let mode = options.get_mode();
    println!("");
    println!("");
    println!("[Day {}] run global", day);
    let start = Instant::now();
    run_simult(Context::new_all(day, &options, &Dataset::Test), fct, mode);
    println!("");
    run_simult(Context::new_all(day, &options, &Dataset::Real), fct, mode);
    let duration = start.elapsed().as_secs_f32() * 1000.0;
    println!("");

    println!("[Day {}] done in {:.2} ms", day, duration);
}

#[allow(dead_code)]
pub fn merge<A, B, C>(first: Option<A>, second: Option<B>, merger: fn(A, B) -> C) -> Option<C> {
    let first = first?;
    let second = second?;
    Some(merger(first, second))
}
